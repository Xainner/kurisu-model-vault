
#!/usr/bin/env python3
"""Kurisu Model Vault CLI"""
import argparse
import asyncio
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.config import settings
from app.database import init_db
from app import hf as hf_module

def print_json(data):
    print(json.dumps(data, indent=2, default=str))

async def cmd_search(args):
    results = await hf_module.search_models(args.query, args.limit)
    for r in results:
        dl = f"{r['downloads']:,}" if r.get('downloads') else "—"
        lk = f"{r['likes']:,}" if r.get('likes') else "—"
        tag = r.get('pipeline_tag', '')
        print(f"  {r['id']:60s}  ↓{dl}  ♥{lk}  {tag}")
    print(f"\n  {len(results)} results")

async def cmd_download(args):
    token = args.token or await hf_module.get_hf_token()
    if not token:
        print("ERROR: No HF token set"); sys.exit(1)
    result = await hf_module.download_model(args.model_id, token)
    if result["success"]:
        print(f"  ✓ Downloaded: {result['model_name']} -> {result.get('local_path')}")
    else:
        print(f"  ✗ Failed: {result.get('error')}"); sys.exit(1)

async def cmd_list(args):
    models = await hf_module.list_local_models()
    if not models:
        print("  No models found."); return
    for m in models:
        size = f"{m['size_bytes']/(1024**3):.1f}GB" if m['size_bytes'] else "—"
        print(f"  {m['name']:60s}  {size:>10s}  {m.get('files_count','?'):>5s} files")
    print(f"\n  {len(models)} model(s)")

async def cmd_delete(args):
    r = await hf_module.delete_model(args.model_name)
    print(f"  {'✓' if r['success'] else '✗'} {r['model_name']} deleted")

async def cmd_verify(args):
    r = await hf_module.verify_model(args.model_name)
    status = "✓ VERIFIED" if r["valid"] else "✗ ISSUES FOUND"
    print(f"  {status}")
    print(f"    Size: {r['size_bytes']/(1024**3):.1f}GB  Files: {r['files_count']}")
    if not r.get("hash_match"):
        print(f"    Hash mismatch!")
    if r.get("missing_from_disk"):
        print(f"    Missing: {len(r['missing_from_disk'])} files")

async def cmd_stats(args):
    s = await hf_module.get_disk_stats()
    for mp, info in s.get("disk", {}).items():
        print(f"  {mp}: {info['percent']}% used, {info['free']/(1024**3):.0f}GB free")
    print(f"  Models: {s['models_count']} ({s['models_total_size']/(1024**3):.1f}GB)")

async def cmd_token(args):
    if args.token_action == "set":
        await hf_module.set_hf_token(args.token)
        print("  ✓ Token saved")
    else:
        t = await hf_module.get_hf_token()
        print(f"  Token: {'***' + t[-6:] if t else 'Not set'}")

def main():
    p = argparse.ArgumentParser(prog="kurisu")
    s = p.add_subparsers(dest="command")
    ps = s.add_parser("search"); ps.add_argument("query"); ps.add_argument("--limit", type=int, default=10)
    pd = s.add_parser("download"); pd.add_argument("model_id"); pd.add_argument("--token")
    s.add_parser("list")
    pdl = s.add_parser("delete"); pdl.add_argument("model_name")
    pv = s.add_parser("verify"); pv.add_argument("model_name")
    s.add_parser("stats")
    pt = s.add_parser("token"); ts = pt.add_subparsers(dest="token_action")
    ts.add_parser("get"); pts = ts.add_parser("set"); pts.add_argument("token")

    cmds = {"search": cmd_search, "download": cmd_download, "list": cmd_list,
            "delete": cmd_delete, "verify": cmd_verify, "stats": cmd_stats, "token": cmd_token}
    args = p.parse_args()
    if not args.command:
        p.print_help(); return
    init_db()
    asyncio.run(cmds[args.command](args))

if __name__ == "__main__":
    main()
