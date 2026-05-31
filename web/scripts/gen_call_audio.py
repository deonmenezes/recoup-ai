"""Pre-generate NVIDIA Magpie (Nemotron Speech) TTS audio for Riley's call lines.

Reads scripts/call-lines.json (produced by dump-lines.mjs), synthesizes each
agent line with the SAME NVIDIA Magpie voice the live phone bot uses, and writes
public/call-audio/<key>.mp3 plus a manifest.json. The in-browser call console
plays these clips so Riley speaks in the real NVIDIA voice (not the browser's).

Run from web/:
    ( set -a; . ../server/.env; set +a; ../server/.venv/bin/python scripts/gen_call_audio.py )
"""

import json
import os
import subprocess
import sys

import riva.client
from riva.client.proto.riva_audio_pb2 import AudioEncoding

SR = 22050
FUNCTION_ID = "877104f7-e885-42b9-8de8-f6e4c6303969"  # magpie-tts-multilingual
VOICE = "Magpie-Multilingual.EN-US.Aria"

key = os.environ.get("NVIDIA_API_KEY", "")
if not key:
    print("NVIDIA_API_KEY missing"); sys.exit(1)

meta = [["function-id", FUNCTION_ID], ["authorization", f"Bearer {key}"]]
svc = riva.client.SpeechSynthesisService(riva.client.Auth(None, True, "grpc.nvcf.nvidia.com:443", meta))

with open("scripts/call-lines.json") as f:
    lines = json.load(f)

outdir = "public/call-audio"
os.makedirs(outdir, exist_ok=True)

done = []
for i, ln in enumerate(lines):
    try:
        resp = svc.synthesize(
            ln["text"], voice_name=VOICE, language_code="en-US",
            encoding=AudioEncoding.LINEAR_PCM, sample_rate_hz=SR,
        )
        out = f"{outdir}/{ln['key']}.mp3"
        p = subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-f", "s16le", "-ar", str(SR),
             "-ac", "1", "-i", "-", "-b:a", "64k", out],
            input=resp.audio,
        )
        if p.returncode == 0 and os.path.getsize(out) > 0:
            done.append(ln["key"])
            print(f"  {i + 1}/{len(lines)} {ln['key']}  ({len(resp.audio)//1024}KB pcm)")
        else:
            print(f"  {i + 1}/{len(lines)} FAILED ffmpeg {ln['key']}")
    except Exception as e:
        print(f"  {i + 1}/{len(lines)} ERROR {ln['key']}: {e}")

with open(f"{outdir}/manifest.json", "w") as f:
    json.dump(done, f)
print(f"done: {len(done)}/{len(lines)} clips")
