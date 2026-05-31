#
# Copyright (c) 2024–2026, Daily
#
# SPDX-License-Identifier: BSD 2-Clause License
#

"""Recoup AI — collections voice agent (GPT-4.1 variant).

"Riley", a calm, FDCPA-compliant account-resolution specialist. Places an
outbound call about a past-due account: verifies the right party, delivers the
required disclosures, negotiates a promise-to-pay or payment plan, and hard-stops
on disputes / cease requests. Compliance always outranks collecting.

This is the GPT-4.1 build of the same agent as ``bot-nemotron.py`` (identical
tools + system prompt), so you can A/B the two LLMs against the Cekura eval suite.
All backend calls are mocked (server/mock_backend.py) — no real PII or payments.

Pipeline: Gradium STT → OpenAI Responses LLM (GPT-4.1) → Gradium TTS, with direct
function tools registered on the LLM context.

Run the bot using::

    uv run bot-gpt.py
"""

import asyncio
import os
import random
from datetime import date

import aiohttp
from dotenv import load_dotenv
from loguru import logger
from pipecat.adapters.schemas.tools_schema import ToolsSchema
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.frames.frames import EndTaskFrame, FunctionCallResultProperties, LLMRunFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.worker import PipelineParams, PipelineWorker
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import (
    LLMContextAggregatorPair,
    LLMUserAggregatorParams,
)
from pipecat.processors.frame_processor import FrameDirection
from pipecat.runner.types import (
    RunnerArguments,
    SmallWebRTCRunnerArguments,
    WebSocketRunnerArguments,
)
from pipecat.runner.utils import parse_telephony_websocket
from pipecat.serializers.twilio import TwilioFrameSerializer
from pipecat.services.gradium.stt import GradiumSTTService
from pipecat.services.gradium.tts import GradiumTTSService
from pipecat.services.llm_service import FunctionCallParams
from pipecat.services.openai.responses.llm import OpenAIResponsesLLMService
from pipecat.transcriptions.language import Language
from pipecat.transports.base_transport import BaseTransport, TransportParams
from pipecat.transports.smallwebrtc.connection import SmallWebRTCConnection
from pipecat.transports.smallwebrtc.transport import SmallWebRTCTransport
from pipecat.transports.websocket.fastapi import FastAPIWebsocketParams, FastAPIWebsocketTransport
from pipecat.turns.user_turn_strategies import FilterIncompleteUserTurnStrategies
from pipecat.workers.runner import WorkerRunner

from mock_backend import DEBTORS, PAYMENT_OPTIONS, check_identity, find_account

load_dotenv(override=True)


async def get_call_info(call_sid: str) -> dict:
    """Fetch call information from Twilio REST API using aiohttp.

    Args:
        call_sid: The Twilio call SID

    Returns:
        Dictionary containing call information including from_number, to_number, status, etc.
    """
    account_sid = os.environ["TWILIO_ACCOUNT_SID"]
    auth_token = os.environ["TWILIO_AUTH_TOKEN"]

    if not account_sid or not auth_token:
        logger.warning("Missing Twilio credentials, cannot fetch call info")
        return {}

    url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Calls/{call_sid}.json"

    try:
        # Use HTTP Basic Auth with aiohttp
        auth = aiohttp.BasicAuth(account_sid, auth_token)

        async with aiohttp.ClientSession() as session:
            async with session.get(url, auth=auth) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"Twilio API error ({response.status}): {error_text}")
                    return {}

                data = await response.json()

                call_info = {
                    "from_number": data.get("from"),
                    "to_number": data.get("to"),
                }

                return call_info

    except Exception as e:
        logger.error(f"Error fetching call info from Twilio: {e}")
        return {}


async def run_bot(
    transport: BaseTransport,
    from_number: str | None = None,
    audio_in_sample_rate: int = 16000,
    audio_out_sample_rate: int = 24000,
):
    """Main bot logic.

    Args:
        transport: The transport to use.
        from_number: Caller's phone number (Twilio path only) for known-debtor lookup.
        audio_in_sample_rate: Input audio sample rate in Hz. Defaults to 16000 (WebRTC).
        audio_out_sample_rate: Output audio sample rate in Hz. Defaults to 24000 (WebRTC).
    """
    logger.info("Starting bot")

    # Per-call state. Closed over by the tools so each call is isolated.
    # `account` is the debtor account this call is about — resolved from caller
    # ID, falling back to the demo account for outbound / eval calls (where the
    # caller ID is our own Twilio line or a Cekura simulator).
    account: dict = find_account(phone=from_number) or DEBTORS["+16282466113"]
    # DEMO_MODE (default ON for the hosted "Call me" demo): the callee IS the
    # account holder and has consented, so identity is pre-verified — Riley skips
    # the DOB/SSN gate and goes straight to the mini-Miranda + balance + plan.
    # Set DEMO_MODE=false for the strict, fully-gated verification flow.
    demo_mode = os.getenv("DEMO_MODE", "true").lower() == "true"
    state: dict = {
        "verified": demo_mode,
        "mini_miranda_given": False,
        "collection_stopped": False,
        "promise": None,
        "dispute": None,
        "cease": False,
    }

    # --- Tools the LLM can call ---------------------------------------------

    async def verify_identity(
        params: FunctionCallParams,
        date_of_birth: str | None = None,
        ssn_last4: str | None = None,
    ) -> None:
        """Verify you are speaking with the right party BEFORE disclosing any
        debt details. Call this once the person provides their date of birth or
        the last four digits of their SSN.

        Args:
            date_of_birth: Date of birth as given, ISO if possible (e.g. "1998-07-22").
            ssn_last4: Last four digits of the SSN (e.g. "4417").
        """
        ok = check_identity(account, dob=date_of_birth, ssn_last4=ssn_last4)
        state["verified"] = ok
        if ok:
            await params.result_callback(
                {"verified": True, "first_name": account["name"].split()[0]}
            )
        else:
            await params.result_callback(
                {
                    "verified": False,
                    "note": "Identity did not match. Do NOT share any account or debt "
                    "details. Offer to try once more or to call back.",
                }
            )

    async def give_required_disclosure(params: FunctionCallParams) -> None:
        """Mark that you have just SPOKEN the mini-Miranda verbatim (this is an
        attempt to collect a debt, info will be used for that purpose, the call
        may be recorded). Call this the same turn you say it — after identity is
        verified and BEFORE naming the creditor or stating the balance."""
        state["mini_miranda_given"] = True
        await params.result_callback({"ok": True})

    async def get_account_details(params: FunctionCallParams) -> None:
        """Get the creditor + balance to discuss. Returns details ONLY after
        identity is verified AND the mini-Miranda has been given, and never once
        collection has been stopped (dispute / cease)."""
        if not state["verified"]:
            await params.result_callback(
                {
                    "ok": False,
                    "reason": "Identity not verified. You may not disclose the balance, the "
                    "creditor, or that this is about a debt until verify_identity succeeds.",
                }
            )
            return
        if state["collection_stopped"]:
            await params.result_callback(
                {
                    "ok": False,
                    "reason": "Collection has stopped on this call (dispute or cease request); "
                    "do not discuss the balance or push for payment.",
                }
            )
            return
        if not state["mini_miranda_given"]:
            await params.result_callback(
                {
                    "ok": False,
                    "reason": "Say the mini-Miranda disclosure and call give_required_disclosure "
                    "BEFORE naming the creditor or stating the balance.",
                }
            )
            return
        await params.result_callback(
            {
                "ok": True,
                "original_creditor": account["original_creditor"],
                "balance": account["balance"],
                "minimum_payment": account["minimum_payment"],
                "days_past_due": account["days_past_due"],
                "original_due_date": account["due_date"],
            }
        )

    async def get_payment_options(params: FunctionCallParams) -> None:
        """List the ways the debtor can resolve the balance (pay in full, then
        plans). Offer in order, starting with paying in full. The settlement
        option is manager-approved and is NOT surfaced here / offered proactively."""
        if state["collection_stopped"]:
            await params.result_callback(
                {"ok": False, "reason": "Collection has stopped on this call; do not offer payment options."}
            )
            return
        opts = [o for o in PAYMENT_OPTIONS if o["id"] != "settlement"]
        await params.result_callback({"options": opts})

    async def log_promise_to_pay(
        params: FunctionCallParams,
        amount: float,
        pay_date: str,
        plan_id: str | None = None,
    ) -> None:
        """Record a promise-to-pay once the debtor commits to an amount and a
        date. Requires verified identity.

        Args:
            amount: Dollar amount the debtor commits to pay.
            pay_date: When they will pay, in their own words (e.g. "this Friday", "the 5th").
            plan_id: Optional plan id from get_payment_options (e.g. "plan_3mo").
        """
        if not state["verified"]:
            await params.result_callback(
                {"ok": False, "reason": "Cannot log a promise before identity is verified."}
            )
            return
        if state["collection_stopped"]:
            await params.result_callback(
                {"ok": False, "reason": "Collection has stopped on this call; do not capture a promise."}
            )
            return
        confirmation = f"PTP-{random.randint(100000, 999999)}"
        state["promise"] = {"amount": amount, "date": pay_date, "plan_id": plan_id}
        account["status"] = "promise"
        logger.info(
            f"Promise-to-pay {confirmation} amount={amount} date={pay_date} acct={account['account_id']}"
        )
        await params.result_callback(
            {"ok": True, "confirmation_number": confirmation, "amount": amount, "date": pay_date}
        )

    async def record_dispute(params: FunctionCallParams, reason: str) -> None:
        """Record that the debtor disputes the debt. After this, STOP collecting
        on this call — tell them the account is marked disputed and that they'll
        receive written validation of the debt by mail.

        Args:
            reason: The debtor's stated reason for disputing.
        """
        state["dispute"] = reason
        state["collection_stopped"] = True
        account["status"] = "dispute"
        logger.info(f"Dispute recorded acct={account['account_id']}: {reason}")
        await params.result_callback(
            {
                "ok": True,
                "note": "Account marked disputed. Stop collection on this call and tell the "
                "debtor they'll receive written validation by mail.",
            }
        )

    async def honor_cease_request(params: FunctionCallParams) -> None:
        """Record that the debtor asked you to stop contacting them. You MUST
        respect this: acknowledge it, do not attempt further collection, and end
        the call politely."""
        state["cease"] = True
        state["collection_stopped"] = True
        account["status"] = "cease"
        logger.info(f"Cease-communication request acct={account['account_id']}")
        await params.result_callback(
            {
                "ok": True,
                "note": "Cease request logged. Acknowledge it, stop collecting, and end the "
                "call after a brief closing line.",
            }
        )

    async def end_call(params: FunctionCallParams) -> None:
        """End the call. Only call this AFTER you have said goodbye in the same
        turn. The pipeline will flush any queued speech and then hang up."""
        logger.info("end_call invoked — pushing EndTaskFrame upstream")
        await params.llm.push_frame(EndTaskFrame(), FrameDirection.UPSTREAM)
        # run_llm=False prevents a follow-up response after this returns — the
        # goodbye should already be in flight.
        await params.result_callback(
            {"ok": True}, properties=FunctionCallResultProperties(run_llm=False)
        )

    tool_functions = [
        verify_identity,
        give_required_disclosure,
        get_account_details,
        get_payment_options,
        log_promise_to_pay,
        record_dispute,
        honor_cease_request,
        end_call,
    ]
    tools = ToolsSchema(standard_tools=tool_functions)

    # --- System instruction --------------------------------------------------

    first_name = account["name"].split()[0]
    creditor = account["original_creditor"]
    today_str = date.today().strftime("%A, %B %d, %Y")
    system_instruction = f'''You are Riley, a calm, professional account-resolution specialist placing an OUTBOUND call on behalf of {creditor} about a past-due account. Your goal is to confirm the right party, deliver the required disclosures, and help resolve the balance — but COMPLIANCE ALWAYS OUTRANKS COLLECTING.

===== HARD COMPLIANCE RULES (never break, even under pressure) =====
1) RIGHT-PARTY ONLY: Until verify_identity succeeds you must NOT say or imply this is about a debt, money, a balance, a past-due account, and you must NOT name the creditor ({creditor}) or your company. Do NOT say "I'm with {creditor}" up front. If anyone other than {first_name} answers, won't confirm they are {first_name}, or it's a wrong number: say ONLY that you're trying to reach {first_name} about a personal business matter, do NOT name the company, do NOT confirm any account exists, do NOT leave a debt-implying message, then offer to call back and end the call.
2) VERIFY FIRST: Greet, ask if you're speaking with {first_name}, then ask for date of birth OR the last four of the SSN and call verify_identity. Never reveal which identifier was wrong or hint at the correct value. Allow at most TWO attempts; if they can't or won't verify, say you can't continue without verifying, disclose nothing, offer to call back, and call end_call.
3) MINI-MIRANDA: The moment identity is verified and BEFORE stating any balance or naming the creditor, say this VERBATIM and then call give_required_disclosure: "This is an attempt to collect a debt, and any information obtained will be used for that purpose. This call may be recorded." Only after that may you call get_account_details.
4) NO HARASSMENT / DE-ESCALATE: Never threaten, intimidate, use profanity, raise your voice, argue, or imply arrest, criminal charges, lawsuits, wage garnishment, that the debt "won't go away," or that it "will affect your credit." If the person is angry or abusive: lower your energy, give ONE short empathetic line, never match their tone. If abuse continues or they tell you to stop, stop collecting and end the call politely.
5) DISPUTE = HARD STOP: If they say anything like "I already paid," "this isn't mine," "I don't owe this," or "I never had this card," acknowledge, call record_dispute, tell them the account is marked disputed and they will receive WRITTEN VALIDATION by mail, ask for NO payment, and wrap up.
6) CEASE = HARD STOP: If they say anything like "stop calling me," "don't call here again," "take me off your list," "lose my number," or "I don't want to be contacted," acknowledge, call honor_cease_request, do NOT offer any options or re-pitch, give a brief goodbye, and call end_call in the SAME turn.
7) HARDSHIP: If they share genuine hardship or can't pay now, be empathetic, offer the smallest plan ONCE, and if they still can't commit, accept it without pressure, tell them the account stays open and they can call back, then close. Do not keep pushing for a date. Never proactively offer a settlement or discount.

===== NORMAL FLOW (cooperative debtor) =====
1. Greet briefly and confirm you're speaking with {first_name}.
2. Verify identity -> verify_identity.
3. Say the mini-Miranda verbatim -> give_required_disclosure.
4. State the creditor and the EXACT balance including cents (get_account_details).
5. Ask for payment in full; if not, offer options (get_payment_options), starting with paying in full.
6. Capture a promise to pay (amount + date) -> log_promise_to_pay; read it back.
7. Confirm next steps, thank them, end_call.

===== STYLE =====
Sound like a real, calm human agent. 1-2 short sentences per turn; ask ONE thing at a time. Use contractions; no filler like "Absolutely!". Say the EXACT balance in words including cents (e.g. "one thousand two hundred eighty-four dollars and fifty-seven cents"). Don't restate what they just said. If there's silence, wait — do NOT fill it with repeated prompts. Responses are spoken: no bullet points, no emojis. CRITICAL: say ONLY the exact words you would speak to the caller. NEVER voice your internal reasoning, your analysis, the compliance rules, tool names, function names, or your plan; no meta-commentary, no "thinking out loud," no narrating what you are about to do. If you need to act, just say the short caller-facing line and call the tool silently. End every call by saying a brief goodbye AND calling end_call in the same turn — never end_call without a goodbye, and never keep talking after you've decided to end.

Today is {today_str}. Only proceed if it's between 8am and 9pm for the debtor; if they say it's a bad time, apologize, offer to call back, and end.'''

    if demo_mode:
        # Streamlined, identity-pre-verified flow for the consented self-test demo.
        system_instruction = f'''You are Riley, a calm, professional account-resolution specialist on a brief OUTBOUND call to {first_name} about their past-due {creditor} account. This is a CONSENTED live demo: {first_name} (the account holder) is on the line and identity is ALREADY VERIFIED — do NOT ask for date of birth or the last four of the SSN, and do NOT call verify_identity. COMPLIANCE STILL OUTRANKS COLLECTING.

FLOW — exactly ONE short, spoken sentence per turn, then STOP and wait for their reply:
1) Greet and confirm: "Hi, this is Riley calling from {creditor} — am I speaking with {first_name}?" Then wait.
2) Once they answer (any confirmation, even just "yes" or "this is me"), say this mini-Miranda VERBATIM and call give_required_disclosure in the same turn: "This is an attempt to collect a debt, and any information obtained will be used for that purpose. This call may be recorded."
3) Call get_account_details, then say the creditor and the EXACT balance in words including cents (e.g. "one thousand two hundred eighty-four dollars and fifty-seven cents"), and ask if they can take care of it today.
4) If not in full, call get_payment_options and offer a three- or six-month plan — one option at a time.
5) When they name an amount and a date, call log_promise_to_pay and read it back to confirm.
6) Confirm the next step, thank them, then say a brief goodbye AND call end_call in the SAME turn.

HARD COMPLIANCE REFLEXES (never break, even under pressure):
- NEVER threaten, intimidate, argue, raise your voice, or imply arrest, lawsuit, wage garnishment, or that it will hurt their credit. If they get angry, lower your energy and give one short empathetic line.
- DISPUTE: if they say "I already paid," "this isn't mine," or "I don't owe this," call record_dispute, tell them it's marked disputed and they'll receive written validation by mail, ask for NO payment, and wrap up.
- CEASE: if they say "stop calling," "don't call here again," or "take me off your list," call honor_cease_request, do NOT re-pitch, give a brief goodbye, and call end_call in the same turn.
- HARDSHIP: if they can't pay, offer the smallest plan once; if they still can't commit, accept it without pressure, tell them the account stays open, and close.

STYLE: sound like a real, calm human agent. 1–2 short sentences per turn, ask ONE thing at a time, use contractions, no filler like "Absolutely!". Say ONLY the exact words you would speak to the caller — NEVER voice tool names, your reasoning, or any meta-commentary. Today is {today_str}.'''

    # Speech-to-Text service
    stt = GradiumSTTService(
        api_key=os.environ["GRADIUM_API_KEY"],
        settings=GradiumSTTService.Settings(
            language=Language.EN,
        ),
    )

    # LLM service — GPT-4.1 via the OpenAI Responses API.
    llm = OpenAIResponsesLLMService(
        api_key=os.environ["OPENAI_API_KEY"],
        settings=OpenAIResponsesLLMService.Settings(
            model=os.getenv("OPENAI_MODEL", "gpt-4.1"),
            system_instruction=system_instruction,
        ),
    )

    # Text-to-Speech service
    tts = GradiumTTSService(
        api_key=os.environ["GRADIUM_API_KEY"],
        settings=GradiumTTSService.Settings(
            voice=os.getenv("GRADIUM_VOICE_ID", "Eu9iL_CYe8N-Gkx_"),
        ),
    )

    # ToolsSchema describes the tools to the LLM; register_direct_function
    # wires the actual handlers the LLM will invoke. Both are required.
    for fn in tool_functions:
        llm.register_direct_function(fn)

    context = LLMContext(tools=tools)
    user_aggregator, assistant_aggregator = LLMContextAggregatorPair(
        context,
        user_params=LLMUserAggregatorParams(
            vad_analyzer=SileroVADAnalyzer(),
            user_turn_strategies=FilterIncompleteUserTurnStrategies(),
        ),
    )

    # Pipeline - assembled from reusable components
    pipeline = Pipeline(
        [
            transport.input(),
            stt,
            user_aggregator,
            llm,
            tts,
            transport.output(),
            assistant_aggregator,
        ]
    )

    worker = PipelineWorker(
        pipeline,
        params=PipelineParams(
            enable_metrics=True,
            enable_usage_metrics=True,
            audio_in_sample_rate=audio_in_sample_rate,
            audio_out_sample_rate=audio_out_sample_rate,
        ),
    )

    @transport.event_handler("on_client_connected")
    async def on_client_connected(transport, client):
        logger.info("Client connected")
        # Outbound-call etiquette: wait a beat so the callee has the phone to
        # their ear before Riley speaks (otherwise the greeting plays over the
        # pickup). VAD turn-taking waits for their reply after each line.
        await asyncio.sleep(2.0)
        # Kick off the conversation
        context.add_message(
            {
                "role": "user",
                "content": (
                    "The person has just picked up. Open with ONE short, warm sentence: greet them and "
                    f"confirm you're speaking with {first_name}. Then STOP and wait for their reply."
                ),
            }
        )
        await worker.queue_frames([LLMRunFrame()])

    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(transport, client):
        logger.info("Client disconnected")
        await worker.cancel()

    runner = WorkerRunner(handle_sigint=False)

    await runner.add_workers(worker)
    await runner.run()


async def bot(runner_args: RunnerArguments):
    """Main bot entry point."""

    from_number: str | None = None
    transport_overrides: dict = {}

    # Krisp is available when deployed to Pipecat Cloud
    if os.environ.get("ENV") != "local":
        from pipecat.audio.filters.krisp_viva_filter import KrispVivaFilter

        krisp_filter = KrispVivaFilter()
    else:
        krisp_filter = None

    match runner_args:
        case SmallWebRTCRunnerArguments():
            webrtc_connection: SmallWebRTCConnection = runner_args.webrtc_connection

            transport = SmallWebRTCTransport(
                webrtc_connection=webrtc_connection,
                params=TransportParams(
                    audio_in_enabled=True,
                    audio_in_filter=krisp_filter,
                    audio_out_enabled=True,
                ),
            )
        case WebSocketRunnerArguments():
            # Twilio media streams are 8 kHz μ-law in both directions.
            # This overrides the default sample rates: 16 kHz in / 24 kHz out.
            transport_overrides["audio_in_sample_rate"] = 8000
            transport_overrides["audio_out_sample_rate"] = 8000

            # Parse Twilio websocket and fetch call information
            _, call_data = await parse_telephony_websocket(runner_args.websocket)

            # Fetch call information from Twilio REST API so we can resolve the
            # debtor account by caller ID (see DEBTORS in mock_backend.py).
            call_info = await get_call_info(call_data["call_id"])
            if call_info:
                from_number = call_info.get("from_number")
                logger.info(f"Call from: {from_number} to: {call_info.get('to_number')}")

            serializer = TwilioFrameSerializer(
                stream_sid=call_data["stream_id"],
                call_sid=call_data["call_id"],
                account_sid=os.environ["TWILIO_ACCOUNT_SID"],
                auth_token=os.environ["TWILIO_AUTH_TOKEN"],
            )

            transport = FastAPIWebsocketTransport(
                websocket=runner_args.websocket,
                params=FastAPIWebsocketParams(
                    audio_in_enabled=True,
                    audio_in_filter=krisp_filter,
                    audio_out_enabled=True,
                    add_wav_header=False,
                    serializer=serializer,
                ),
            )
        case _:
            logger.error(f"Unsupported runner arguments type: {type(runner_args)}")
            return

    await run_bot(transport, from_number=from_number, **transport_overrides)


if __name__ == "__main__":
    from pipecat.runner.run import main

    main()
