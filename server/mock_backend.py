#
# Copyright (c) 2024–2026, Daily
#
# SPDX-License-Identifier: BSD 2-Clause License
#

"""Mock collections backend for Recoup AI (hackathon).

All data is fake. No real PII, no real payments. Debtor accounts are keyed by
the caller's phone number (E.164) so the bot can right-party-verify and
personalize, plus by account_id for lookup when caller ID is unknown.

Exports:
    DEBTORS          - phone/E.164 -> account dict
    ACCOUNTS_BY_ID   - account_id -> account dict (same objects)
    PAYMENT_OPTIONS  - list of plan dicts the agent may offer
    find_account     - helper: look up by phone or account_id
    check_identity   - right-party verification (DOB or last-4 SSN)
"""

# ── Debtor accounts ──────────────────────────────────────────────────────────
# identity = the right-party-verification challenge (DOB + last 4 of SSN).
# The agent MUST verify identity before disclosing any balance/debt detail
# (FDCPA third-party-disclosure rule).
DEBTORS: dict = {
    # The demo number — calling this rings a "known debtor" so the agent
    # personalizes and runs the full compliant flow.
    "+16282466113": {
        "account_id": "RC-48213",
        "name": "Deon Menezes",
        "original_creditor": "Summit Bank Visa",
        "balance": 1284.57,
        "days_past_due": 47,
        "due_date": "April 13th",
        "minimum_payment": 75.00,
        "identity": {"dob": "1998-07-22", "ssn_last4": "4417"},
        "status": "delinquent",  # delinquent | promise | dispute | cease | paid
    },
    "+14155550142": {
        "account_id": "RC-50991",
        "name": "Maria Alvarez",
        "original_creditor": "Lumen Auto Finance",
        "balance": 3920.00,
        "days_past_due": 92,
        "due_date": "March 1st",
        "minimum_payment": 210.00,
        "identity": {"dob": "1985-11-03", "ssn_last4": "8830"},
        "status": "delinquent",
    },
    "+13125550188": {
        "account_id": "RC-51220",
        "name": "James Carter",
        "original_creditor": "Northwind Personal Loan",
        "balance": 642.10,
        "days_past_due": 21,
        "due_date": "May 9th",
        "minimum_payment": 50.00,
        "identity": {"dob": "1991-02-14", "ssn_last4": "1190"},
        "status": "delinquent",
    },
}

ACCOUNTS_BY_ID: dict = {acct["account_id"]: acct for acct in DEBTORS.values()}

# ── Payment / resolution options the agent may offer ─────────────────────────
# Offered in order of creditor preference: pay-in-full > short plan > longer
# plan > settlement.
PAYMENT_OPTIONS: list = [
    {
        "id": "pay_in_full",
        "label": "Pay the full balance today",
        "description": "Settles the account immediately, no further interest or fees.",
    },
    {
        "id": "plan_3mo",
        "label": "Three-month plan",
        "description": "Split the balance into 3 equal monthly payments, no fee.",
    },
    {
        "id": "plan_6mo",
        "label": "Six-month plan",
        "description": "Split the balance into 6 smaller monthly payments.",
    },
    {
        "id": "settlement",
        "label": "One-time settlement",
        "description": "Settle for 70% of the balance in a single payment (manager-approved).",
    },
]


def find_account(phone: str | None = None, account_id: str | None = None) -> dict | None:
    """Look up a debtor account by phone (E.164) or account_id. None if absent."""
    if phone and phone in DEBTORS:
        return DEBTORS[phone]
    if account_id and account_id.upper() in ACCOUNTS_BY_ID:
        return ACCOUNTS_BY_ID[account_id.upper()]
    return None


def check_identity(account: dict, dob: str | None = None, ssn_last4: str | None = None) -> bool:
    """Right-party check, tolerant of speech/ASR variation.

    SSN matches if the on-file last-4 appears in the digits of the supplied
    value; DOB matches if the full ISO digits appear, or the on-file year AND
    day both appear. Both absent/wrong -> fail (so wrong-party still fails).
    """
    if not account:
        return False
    import re

    ident = account.get("identity", {})
    target_ssn = ident.get("ssn_last4", "")
    if ssn_last4 and target_ssn:
        if target_ssn in re.sub(r"\D", "", ssn_last4):
            return True
    target_dob = ident.get("dob", "")  # e.g. "1998-07-22"
    if dob and target_dob:
        d = re.sub(r"\D", "", dob)
        yr, day = target_dob[:4], target_dob[8:10]
        if re.sub(r"\D", "", target_dob) in d or (yr in d and day in d):
            return True
    return False
