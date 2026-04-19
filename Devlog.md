# 2026-04-19 — Kathalog MVP

## What I shipped
A working book gifting tracker web app, live at https://kathalog.app

## What got built
- PocketBase backend on Hetzner, running as a systemd service
- Books collection with full schema (gift number, cover, notes, tags, status)
- React frontend — Login, Library, Add Book, Detail screens
- Google Books API search with auto-fill
- Gift number auto-suggest + uniqueness enforcement
- Book covers (fixed URL field → Text field in PocketBase)
- Deployed to kathalog.app with SSL via Let's Encrypt
- Saved to phone home screen — feels like a real app

## Time spent
~4.5 hours total

## Bugs hit & fixed
- Navigation not working → requestKey: null on all PocketBase calls
- Click handlers silently failing → inlined onClick, removed prop chain
- Covers not saving → PocketBase URL field strips Google Books URLs, changed to Text
- Login failing on domain → PocketBase URL was still pointing to IP

## Phase 2 backlog
- Higher quality book covers (zoom parameter)
- Multi-source search (Open Library for Indian books)
- Barcode/ISBN scanning
- Stats dashboard
- Wife's account setup + shared view testing

## Kill metric
All 50+ existing books logged by Day 60 (June 18, 2026)

## Learnings
- PocketBase autocancel is silent and deadly — requestKey: null everywhere
- Field type matters — URL fields validate, Text fields don't
- .app domains + Let's Encrypt = live HTTPS in under 10 minutes
- Ship first, polish later — covers are low quality but it works
