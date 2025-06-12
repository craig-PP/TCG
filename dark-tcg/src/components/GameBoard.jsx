import { useState, useEffect } from 'react';
import Card from './Card.jsx';
import { createGameState, playCard, canAffordCard, attackWithCreature, endTurn, getValidTargets } from '../game/gameEngine.js';
import { CARDS, CARD_TYPES, ENERGY_TYPES } from '../data/cards.js';
import './GameBoard.css';

function GameBoard() {
  const [gameState, setGameState] = useState(createGameState());
  const [selectedCard, setSelectedCard] = useState(null);
  const [targetingMode, setTargetingMode] = useState(false);
  const [attackingCreature, setAttackingCreature] = useState(null);
  const [validTargets, setValidTargets] = useState([]);
  const [message, setMessage] = useState('');
  const [showHelp, setShowHelp] = useState(true);

  const currentPlayer = gameState.players[gameState.currentPlayer];
  const opponent = gameState.players[gameState.currentPlayer === 1 ? 2 : 1];

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const resetSelection = () => {
    setTargetingMode(false);
    setSelectedCard(null);
    setAttackingCreature(null);
    setValidTargets([]);
  };

  const handleCardClick = (cardId, instanceId) => {
    if (gameState.gameOver) return;

    // If we're in attack mode and clicking a valid target
    if (attackingCreature) {
      const targetId = instanceId || `player_${opponent.id}`;
      const isValidTarget = validTargets.some(t => t.id === targetId);
      
      if (isValidTarget) {
        const result = attackWithCreature(gameState, attackingCreature, targetId);
        
        if (result.success) {
          setGameState({...gameState});
          showMessage('Attack successful!');
        } else {
          showMessage(result.error);
        }
        
        resetSelection();
        return;
      }
    }

    // If in spell targeting mode
    if (targetingMode && selectedCard && !attackingCreature) {
      const targetId = instanceId || `player_${opponent.id}`;
      const isValidTarget = validTargets.some(t => t.id === targetId);
      
      if (isValidTarget) {
        const result = playCard(gameState, gameState.currentPlayer, selectedCard, targetId);
        
        if (result.success) {
          setGameState({...gameState});
          showMessage(`Played ${CARDS[selectedCard].name}`);
        } else {
          showMessage(result.error);
        }
        
        resetSelection();
        return;
      }
    }

    // If clicking on a card in hand
    if (currentPlayer.hand.includes(cardId)) {
      const card = CARDS[cardId];
      
      if (!canAffordCard(currentPlayer, cardId)) {
        showMessage('Not enough energy to play this card');
        return;
      }

      // Check if card needs targeting
      const targets = getValidTargets(gameState, gameState.currentPlayer, cardId);
      if (targets.length > 0) {
        setSelectedCard(cardId);
        setTargetingMode(true);
        setValidTargets(targets);
        showMessage('Select a target for this card');
        return;
      }

      // Play card immediately if no targeting needed
      const result = playCard(gameState, gameState.currentPlayer, cardId);
      if (result.success) {
        setGameState({...gameState});
        showMessage(`Played ${card.name}`);
      } else {
        showMessage(result.error);
      }
    }

    // If clicking on creature on battlefield for attack
    if (instanceId && currentPlayer.battlefield.some(c => c.instanceId === instanceId)) {
      const creature = currentPlayer.battlefield.find(c => c.instanceId === instanceId);
      if (creature && creature.canAttack) {
        setAttackingCreature(instanceId);
        // Valid attack targets: opponent creatures + opponent player
        const attackTargets = [
          ...opponent.battlefield.map(c => ({
            id: c.instanceId,
            name: CARDS[c.cardId].name,
            type: 'creature'
          })),
          {
            id: `player_${opponent.id}`,
            name: opponent.name,
            type: 'player'
          }
        ];
        setValidTargets(attackTargets);
        showMessage('Select attack target');
      } else if (creature && !creature.canAttack) {
        showMessage('This creature cannot attack yet (summoning sickness)');
      }
    }
  };

  const handleEndTurn = () => {
    endTurn(gameState);
    setGameState({...gameState});
    resetSelection();
    showMessage(`${currentPlayer.name}'s turn ended`);
  };

  const getEnergyIcon = (energyType) => {
    // Return CSS class for pixel art icons
    return `energy-icon-${energyType}`;
  };

  const renderEnergyDisplay = (player) => {
    return (
      <div className="energy-display">
        {Object.entries(player.energy).map(([energyType, amount]) => {
          if (amount === 0) return null;
          const used = player.usedEnergy[energyType];
          const available = amount - used;
          
          return (
            <div key={energyType} className={`energy-${energyType}`}>
              <span className={getEnergyIcon(energyType)}></span>
              <span className="energy-amount">
                {available}/{amount}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderHelpOverlay = () => {
    if (!showHelp) return null;
    
    return (
      <div className="help-overlay" onClick={() => setShowHelp(false)}>
        <div className="help-content">
          <h2>⚔ ESCAPE THE DARK TOWER ⚔</h2>
          
          <div className="help-section">
            <h3>⚡ GOAL</h3>
            <p>Defeat your opponent before they defeat you!</p>
          </div>
          
          <div className="help-section">
            <h3>⚒ YOUR TURN</h3>
            <ol>
              <li><strong>Play Energy Cards</strong> - Free to play, provides mana for other cards</li>
              <li><strong>Summon Creatures</strong> - Costs energy, attacks opponents</li>
              <li><strong>Cast Spells</strong> - One-time effects</li>
              <li><strong>Attack</strong> - Click your creatures to attack (can't attack first turn)</li>
              <li><strong>End Turn</strong> - Click the End Turn button</li>
            </ol>
          </div>
          
          <div className="help-section">
            <h3>⚡ TIPS</h3>
            <ul>
              <li>Glowing cards can be played</li>
              <li>Red glowing creatures can attack</li>
              <li>Build up energy before playing expensive cards</li>
              <li>Read card abilities - some have special effects!</li>
            </ul>
          </div>
          
          <button className="help-close-btn" onClick={(e) => {
            e.stopPropagation();
            setShowHelp(false);
          }}>
            Start Playing!
          </button>
        </div>
      </div>
    );
  };

  const renderPlayerInfo = (player, isCurrentPlayer) => {
    const isPlayerTarget = validTargets.some(t => t.id === `player_${player.id}`);
    
    return (
      <div 
        className={`player-info ${isCurrentPlayer ? 'current-player' : 'opponent'} ${isPlayerTarget ? 'valid-target' : ''}`}
        onClick={() => {
          if (isPlayerTarget && (attackingCreature || targetingMode)) {
            handleCardClick(null, `player_${player.id}`);
          }
        }}
      >
        <div className="player-header">
          <h3>{player.name} {isCurrentPlayer ? '' : ''}</h3>
          <div className="health">
            <span className="icon-health"></span> {player.health}
          </div>
          <div className="deck-count">
            <span className="icon-deck"></span> {player.deck.length}
          </div>
        </div>
        {renderEnergyDisplay(player)}
      </div>
    );
  };

  const renderHand = (player, isCurrentPlayer) => {
    if (!isCurrentPlayer) {
      return (
        <div className="opponent-hand">
          <div className="hand-count">Cards in hand: {player.hand.length}</div>
        </div>
      );
    }

    return (
      <div className="player-hand">
        <h4>Your Hand</h4>
        <div className="hand-cards">
          {player.hand.map((cardId, index) => (
            <Card
              key={`${cardId}-${index}`}
              cardId={cardId}
              canPlay={canAffordCard(player, cardId)}
              onClick={handleCardClick}
              isInHand={true}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderBattlefield = (player, isCurrentPlayer) => {
    return (
      <div className={`battlefield ${isCurrentPlayer ? 'player-battlefield' : 'opponent-battlefield'}`}>
        <h4>{isCurrentPlayer ? 'Your Creatures' : `${player.name}'s Creatures`}</h4>
        <div className="battlefield-cards">
          {player.battlefield.map((creature) => {
            const isAttacking = attackingCreature === creature.instanceId;
            const isValidTarget = validTargets.some(t => t.id === creature.instanceId);
            
            return (
              <Card
                key={creature.instanceId}
                cardId={creature.cardId}
                instanceId={creature.instanceId}
                currentHealth={creature.currentHealth}
                canAttack={creature.canAttack && isCurrentPlayer}
                onClick={handleCardClick}
                isOnBattlefield={true}
                isAttacking={isAttacking}
                isValidTarget={isValidTarget}
              />
            );
          })}
        </div>
      </div>
    );
  };

  if (gameState.gameOver) {
    return (
      <div className="game-over">
        <h1>Game Over!</h1>
        <h2>{gameState.players[gameState.winner].name} Wins!</h2>
        <button onClick={() => setGameState(createGameState())}>
          New Game
        </button>
      </div>
    );
  }

  return (
    <div className="game-board">
      {renderHelpOverlay()}
      
      <div className="game-header">
        <h1>DARK TOWER</h1>
        <div className="turn-info">
          Turn {gameState.turn} - {currentPlayer.name}'s Turn
        </div>
        {message && <div className="game-message">{message}</div>}
      </div>

      {/* Opponent Area */}
      <div className="opponent-area">
        {renderPlayerInfo(opponent, false)}
        {renderHand(opponent, false)}
        {renderBattlefield(opponent, false)}
      </div>

      {/* Game Controls */}
      <div className="game-controls">
        <button 
          className="end-turn-btn" 
          onClick={handleEndTurn}
          disabled={targetingMode || attackingCreature}
        >
          End Turn
        </button>
        {(targetingMode || attackingCreature) && (
          <button 
            className="cancel-btn" 
            onClick={resetSelection}
          >
            Cancel
          </button>
        )}
        <button 
          className="help-btn" 
          onClick={() => setShowHelp(true)}
        >
          ?
        </button>
      </div>

      {/* Current Player Area */}
      <div className="current-player-area">
        {renderBattlefield(currentPlayer, true)}
        {renderHand(currentPlayer, true)}
        {renderPlayerInfo(currentPlayer, true)}
      </div>
    </div>
  );
}

export default GameBoard;