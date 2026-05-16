# Business Requirements Specification (BRS)
# Social Jukebox Application

**Document Version:** 1.0  
**Date:** 2026-05-16  
**Status:** Draft  
**Author:** MistaKrabs 🦀

---

## 1. Executive Summary

**Project Name:** Social Jukebox (Working Title)  
**Project Type:** Mobile-first PWA with real-time synchronization  
**Core Feature Summary:** A collaborative music queue where hosts create rooms with PIN codes (for room routing, not security), guests join via web interface, and songs play through the host's connected speakers.  
**Audio-First Design:** YouTube integration prioritizes audio playback; video is optional or disabled to reduce data usage and focus on music experience.  
**Target Users:** Party hosts, event organizers, friend groups gathering at a venue

---

## 2. Problem Statement

Current solutions for shared music at social gatherings suffer from:
- **Single-point-of-control:** Only one device controls playback
- **Speaker dependency:** No way to play through external speakers without complex setup
- **Account sharing:** Users must share login credentials to play from their playlists
- **Clunky collaboration:** Passing around one phone or speaker is disruptive

---

## 3. Business Objectives

| ID | Objective | Success Metric |
|----|-----------|----------------|
| BO-1 | Enable 1-5 users to collaboratively build a music queue | Multiple users successfully adding tracks in test |
| BO-2 | Provide low-latency real-time sync across all connected devices | <500ms queue update latency |
| BO-3 | Support multiple streaming sources (YouTube, Spotify, Apple Music, Amazon Music) | At least YouTube working in MVP |
| BO-4 | Allow playback through host's speakers OR directly on guest phones | Both playback modes functional |
| BO-5 | Simple room creation with PIN-based routing | Room created and joined within 30 seconds |

---

## 4. Target Market

- **Primary:** Adults 18-45 who host social gatherings (parties, BBQs, game nights)
- **Secondary:** Venues seeking background music solutions (cafes, small event spaces)
- **Tertiary:** Friend groups wanting collaborative playlists without account sharing

---

## 5. Value Proposition

| Stakeholder | Value |
|-------------|-------|
| **Host** | Control who joins, simple setup, no account sharing required |
| **Guest** | Add songs from own library, vote to skip, don't need to hand over phone |
| **Venue** | No complex AV setup, guests control the vibe |

---

## 6. Functional Requirements Overview

| ID | Requirement | Priority |
|----|-------------|----------|
| BR-F1 | Host creates a room and receives a unique PIN code (for room routing, similar to Jack Box games) | Must |
| BR-F2 | Guests join room by entering PIN | Must |
| BR-F3 | Users search and add songs from at least YouTube | Must |
| BR-F4 | Queue displays in real-time on all connected devices | Must |
| BR-F5 | Music plays through host's device or connected speakers | Must |
| BR-F6 | FIFO queue with skip-voting functionality | Should |
| BR-F7 | Host can promote another user to host if disconnected | Should |
| BR-F8 | Room expires after inactivity (configurable) | Could |
| BR-F9 | LAN-based device discovery for proximity joining | Could |
| BR-F10 | Bluetooth proximity-based room joining | Could |

---

## 7. Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| BR-NF1 | Real-time sync latency | <500ms |
| BR-NF2 | Audio playback latency | <2 seconds from play command |
| BR-NF3 | Mobile-first responsive design | Works on 320px - 428px screens |
| BR-NF4 | PWA installable | Add to Home Screen works |
| BR-NF5 | Maximum concurrent users per room | 5 (MVP), scalable |

---

## 8. Revenue Model (Future Consideration)

- Freemium: Free rooms limited to 3 guests, Premium (paid) for 5+ guests
- Optional: Venue licensing for commercial use

---

## 9. Success Criteria

The MVP is considered successful when:
1. A host creates a room and shares the PIN
2. 1-4 guests join the room via PIN
3. Guests search YouTube and add songs to the queue
4. Songs play in FIFO order on the host's device
5. Skip voting works and affects playback
6. Real-time queue updates across all connected devices

---

## 10. Constraints & Assumptions

- MVP uses YouTube as sole music source (audio-only or video disabled)
- MVP limited to 5 users per room
- Assumes host has decent internet connection
- No Bluetooth implementation in MVP (future phase)
- No persistent user accounts in MVP (session-only auth)
- **Code Upgradeability:** Architecture must be modular and extensible to support future integrations (Spotify, Apple Music, Amazon Music, Bluetooth, DJ mode)

---

## 11. Future Considerations (Post-MVP)

- Spotify, Apple Music, Amazon Music integrations
- "Cast from phone" hybrid model implementation
- Shared room login for group account access
- Bluetooth proximity joining
- Host DJ mode with turntable integration
- Room persistence across sessions
- Social features: user profiles, play history

---

**End of BRS**