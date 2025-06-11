import { CARDS, CARD_TYPES, ENERGY_TYPES, STARTER_DECKS } from '../data/cards.js';

// Game phases
export const GAME_PHASES = {
  DRAW: 'draw',
  MAIN: 'main',
  COMBAT: 'combat',
  END: 'end'
};

// Game actions
export const ACTIONS = {
  PLAY_CARD: 'play_card',
  ATTACK: 'attack',
  END_TURN: 'end_turn',
  ACTIVATE_ABILITY: 'activate_ability'
};

// Create initial game state
export function createGameState(player1Deck = 'shadow_deck', player2Deck = 'blood_deck') {
  const shuffledDeck1 = shuffleDeck(STARTER_DECKS[player1Deck].cards);
  const shuffledDeck2 = shuffleDeck(STARTER_DECKS[player2Deck].cards);
  
  return {
    currentPlayer: 1,
    phase: GAME_PHASES.DRAW,
    turn: 1,
    gameOver: false,
    winner: null,
    
    players: {
      1: {
        id: 1,
        name: 'Player 1',
        health: 20,
        deck: shuffledDeck1.slice(7), // Remaining deck after initial draw
        hand: shuffledDeck1.slice(0, 7), // Initial hand of 7 cards
        battlefield: [],
        discard: [],
        energy: {
          [ENERGY_TYPES.SHADOW]: 0,
          [ENERGY_TYPES.BLOOD]: 0,
          [ENERGY_TYPES.BONE]: 0,
          [ENERGY_TYPES.SPIRIT]: 0
        },
        usedEnergy: {
          [ENERGY_TYPES.SHADOW]: 0,
          [ENERGY_TYPES.BLOOD]: 0,
          [ENERGY_TYPES.BONE]: 0,
          [ENERGY_TYPES.SPIRIT]: 0
        }
      },
      2: {
        id: 2,
        name: 'Player 2',
        health: 20,
        deck: shuffledDeck2.slice(7),
        hand: shuffledDeck2.slice(0, 7),
        battlefield: [],
        discard: [],
        energy: {
          [ENERGY_TYPES.SHADOW]: 0,
          [ENERGY_TYPES.BLOOD]: 0,
          [ENERGY_TYPES.BONE]: 0,
          [ENERGY_TYPES.SPIRIT]: 0
        },
        usedEnergy: {
          [ENERGY_TYPES.SHADOW]: 0,
          [ENERGY_TYPES.BLOOD]: 0,
          [ENERGY_TYPES.BONE]: 0,
          [ENERGY_TYPES.SPIRIT]: 0
        }
      }
    }
  };
}

// Utility function to shuffle deck
function shuffleDeck(cards) {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Check if player can afford to play a card
export function canAffordCard(player, cardId) {
  const card = CARDS[cardId];
  if (!card || card.type === CARD_TYPES.ENERGY) return true;
  
  const cost = card.cost || {};
  const availableEnergy = {};
  
  // Calculate available energy (total - used)
  Object.keys(player.energy).forEach(energyType => {
    availableEnergy[energyType] = player.energy[energyType] - player.usedEnergy[energyType];
  });
  
  // Check if we have enough of each required energy type
  return Object.entries(cost).every(([energyType, amount]) => {
    return availableEnergy[energyType] >= amount;
  });
}

// Play a card
export function playCard(gameState, playerId, cardId, targetId = null) {
  const player = gameState.players[playerId];
  const card = CARDS[cardId];
  
  if (!card || !player.hand.includes(cardId)) {
    return { success: false, error: 'Invalid card or not in hand' };
  }
  
  if (!canAffordCard(player, cardId)) {
    return { success: false, error: 'Not enough energy' };
  }
  
  // Remove card from hand
  const handIndex = player.hand.indexOf(cardId);
  player.hand.splice(handIndex, 1);
  
  // Handle different card types
  switch (card.type) {
    case CARD_TYPES.ENERGY:
      // Add energy
      player.energy[card.energyType]++;
      player.discard.push(cardId);
      break;
      
    case CARD_TYPES.CREATURE:
      // Pay energy cost
      const cost = card.cost || {};
      Object.entries(cost).forEach(([energyType, amount]) => {
        player.usedEnergy[energyType] += amount;
      });
      
      // Add creature to battlefield with full health
      const creatureInstance = {
        id: cardId,
        cardId: cardId,
        instanceId: Date.now() + Math.random(), // Simple unique ID
        currentHealth: card.health,
        canAttack: false, // Summoning sickness
        abilities: [...(card.abilities || [])]
      };
      player.battlefield.push(creatureInstance);
      
      // Handle creature abilities
      handleCreatureAbilities(gameState, playerId, creatureInstance, 'play');
      break;
      
    case CARD_TYPES.SPELL:
      // Pay energy cost
      const spellCost = card.cost || {};
      Object.entries(spellCost).forEach(([energyType, amount]) => {
        player.usedEnergy[energyType] += amount;
      });
      
      // Handle spell effects
      handleSpellEffect(gameState, playerId, card, targetId);
      player.discard.push(cardId);
      break;
  }
  
  return { success: true };
}

// Handle creature abilities
function handleCreatureAbilities(gameState, playerId, creature, trigger) {
  const card = CARDS[creature.cardId];
  const abilities = card.abilities || [];
  
  abilities.forEach(ability => {
    if (trigger === 'play') {
      if (ability.includes('opponent discards 1 card')) {
        const opponent = gameState.players[playerId === 1 ? 2 : 1];
        if (opponent.hand.length > 0) {
          const randomIndex = Math.floor(Math.random() * opponent.hand.length);
          const discardedCard = opponent.hand.splice(randomIndex, 1)[0];
          opponent.discard.push(discardedCard);
        }
      } else if (ability.includes('gain 1 health')) {
        gameState.players[playerId].health += 1;
      } else if (ability.includes('Quick Strike')) {
        creature.canAttack = true;
      }
    }
  });
}

// Handle spell effects
function handleSpellEffect(gameState, playerId, spell, targetId) {
  const player = gameState.players[playerId];
  const opponent = gameState.players[playerId === 1 ? 2 : 1];
  
  switch (spell.effect) {
    case 'gain_energy':
      // Dark Ritual - gain 2 additional energy
      Object.keys(player.energy).forEach(energyType => {
        if (player.energy[energyType] > 0) {
          player.energy[energyType] += 2;
          return;
        }
      });
      break;
      
    case 'drain':
      // Drain Life - deal 3 damage, gain 3 health
      if (targetId) {
        const target = findCreatureById(gameState, targetId);
        if (target) {
          target.currentHealth -= 3;
          player.health += 3;
          if (target.currentHealth <= 0) {
            removeCreatureFromBattlefield(gameState, target);
          }
        }
      }
      break;
      
    case 'damage':
      // Soul Burn - deal 4 damage
      if (targetId) {
        if (targetId.startsWith('player_')) {
          const targetPlayerId = parseInt(targetId.split('_')[1]);
          gameState.players[targetPlayerId].health -= 4;
        } else {
          const target = findCreatureById(gameState, targetId);
          if (target) {
            target.currentHealth -= 4;
            if (target.currentHealth <= 0) {
              removeCreatureFromBattlefield(gameState, target);
            }
          }
        }
      }
      break;
  }
}

// Find creature by instance ID
function findCreatureById(gameState, instanceId) {
  for (const player of Object.values(gameState.players)) {
    const creature = player.battlefield.find(c => c.instanceId === instanceId);
    if (creature) return creature;
  }
  return null;
}

// Remove creature from battlefield
function removeCreatureFromBattlefield(gameState, creature) {
  for (const player of Object.values(gameState.players)) {
    const index = player.battlefield.findIndex(c => c.instanceId === creature.instanceId);
    if (index !== -1) {
      player.battlefield.splice(index, 1);
      player.discard.push(creature.cardId);
      break;
    }
  }
}

// Attack with creature
export function attackWithCreature(gameState, attackerId, targetId) {
  const attacker = findCreatureById(gameState, attackerId);
  if (!attacker || !attacker.canAttack) {
    return { success: false, error: 'Cannot attack with this creature' };
  }
  
  const attackerCard = CARDS[attacker.cardId];
  
  if (targetId.startsWith('player_')) {
    // Attack player directly
    const targetPlayerId = parseInt(targetId.split('_')[1]);
    gameState.players[targetPlayerId].health -= attackerCard.attack;
    attacker.canAttack = false;
  } else {
    // Attack creature
    const target = findCreatureById(gameState, targetId);
    if (!target) {
      return { success: false, error: 'Invalid target' };
    }
    
    const targetCard = CARDS[target.cardId];
    
    // Deal damage to both creatures
    target.currentHealth -= attackerCard.attack;
    attacker.currentHealth -= targetCard.attack;
    
    // Remove dead creatures
    if (target.currentHealth <= 0) {
      removeCreatureFromBattlefield(gameState, target);
    }
    if (attacker.currentHealth <= 0) {
      removeCreatureFromBattlefield(gameState, attacker);
    }
    
    attacker.canAttack = false;
  }
  
  return { success: true };
}

// End turn
export function endTurn(gameState) {
  const currentPlayer = gameState.players[gameState.currentPlayer];
  
  // Reset used energy
  Object.keys(currentPlayer.usedEnergy).forEach(energyType => {
    currentPlayer.usedEnergy[energyType] = 0;
  });
  
  // All creatures can attack next turn
  currentPlayer.battlefield.forEach(creature => {
    creature.canAttack = true;
  });
  
  // Switch to other player
  gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
  gameState.turn++;
  gameState.phase = GAME_PHASES.DRAW;
  
  // Draw a card for the new current player
  const newCurrentPlayer = gameState.players[gameState.currentPlayer];
  if (newCurrentPlayer.deck.length > 0) {
    const drawnCard = newCurrentPlayer.deck.shift();
    newCurrentPlayer.hand.push(drawnCard);
  }
  
  // Check for game over conditions
  if (gameState.players[1].health <= 0) {
    gameState.gameOver = true;
    gameState.winner = 2;
  } else if (gameState.players[2].health <= 0) {
    gameState.gameOver = true;
    gameState.winner = 1;
  }
  
  gameState.phase = GAME_PHASES.MAIN;
}

// Get valid targets for a card/ability
export function getValidTargets(gameState, playerId, cardId) {
  const card = CARDS[cardId];
  const targets = [];
  
  if (card.type === CARD_TYPES.SPELL) {
    switch (card.effect) {
      case 'drain':
      case 'damage':
        // Can target any creature or player
        Object.values(gameState.players).forEach(player => {
          player.battlefield.forEach(creature => {
            targets.push({
              id: creature.instanceId,
              name: CARDS[creature.cardId].name,
              type: 'creature'
            });
          });
          targets.push({
            id: `player_${player.id}`,
            name: player.name,
            type: 'player'
          });
        });
        break;
    }
  }
  
  return targets;
}