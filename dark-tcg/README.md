# 🌙 Dark TCG ⚔️

A web-based Trading Card Game with a creepy medieval/fantasy theme, built with React and Vite.

## Features

- **Turn-based gameplay** similar to Pokemon Pocket TCG mechanics
- **Four energy types**: Shadow 🌑, Blood 🩸, Bone 💀, Spirit 👻
- **Three card types**: Creatures, Spells, and Energy cards
- **20-card decks** with balanced gameplay
- **Dark medieval/fantasy theme** with atmospheric styling
- **Responsive design** that works on desktop and mobile

## Game Mechanics

### Energy System
- Play energy cards to generate mana for casting spells and summoning creatures
- Four energy types: Shadow, Blood, Bone, and Spirit
- Energy persists between turns, but usage resets each turn

### Card Types

**Energy Cards**
- Provide resources to play other cards
- Free to play and go to discard after use

**Creature Cards**
- Summoned to the battlefield to attack and defend
- Have Attack and Health stats
- Cannot attack the turn they're played (summoning sickness)
- Some have special abilities that trigger when played

**Spell Cards**
- One-time effects that go to discard after use
- Can target creatures or players
- Various effects: damage, healing, buffs, etc.

### Winning
- Reduce opponent's health to 0 to win
- Each player starts with 20 health

## How to Play

1. **Start your turn** by drawing a card (automatic)
2. **Play energy cards** to build your mana pool
3. **Summon creatures** by paying their energy cost
4. **Cast spells** to affect the game state
5. **Attack** with creatures that can attack (not summoning sick)
6. **End your turn** when finished

### Controls
- **Click cards in hand** to play them
- **Click creatures on battlefield** to attack with them
- **Click targets** when prompted for spells/attacks
- **End Turn button** to pass to opponent

## Starter Decks

### Shadow Corruption
- Focuses on Shadow and Spirit energy
- Features wraiths, assassins, and necromancy
- Strategy: Control and manipulation

### Blood Sacrifice
- Uses Blood and Bone energy primarily
- Demons, cultists, and life drain effects
- Strategy: Aggressive damage and healing

## Development

Built with:
- **React** for the UI framework
- **Vite** for fast development and building
- **CSS** for dark fantasy styling
- **Vanilla JavaScript** for game logic

## Future Features

- Bitcoin authentication integration (like Xverse)
- Online multiplayer
- Deck building interface
- More cards and mechanics
- Tournament mode
- Collection management

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173 to play the game.

---

*"In the darkness, only the strongest survive..."*
