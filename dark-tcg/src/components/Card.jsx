import { CARDS, CARD_TYPES, ENERGY_TYPES } from '../data/cards.js';
import './Card.css';

function Card({ cardId, instanceId, currentHealth, canPlay = true, canAttack = false, onClick, isInHand = false, isOnBattlefield = false }) {
  const card = CARDS[cardId];
  
  if (!card) return null;
  
  const handleClick = () => {
    if (onClick) {
      onClick(cardId, instanceId);
    }
  };
  
  const getEnergyIcon = (energyType) => {
    const icons = {
      [ENERGY_TYPES.SHADOW]: '🌑',
      [ENERGY_TYPES.BLOOD]: '🩸',
      [ENERGY_TYPES.BONE]: '💀',
      [ENERGY_TYPES.SPIRIT]: '👻'
    };
    return icons[energyType] || '⚡';
  };
  
  const getRarityClass = (rarity) => {
    return `card-${rarity}`;
  };
  
  const getCardTypeClass = () => {
    return `card-${card.type}`;
  };
  
  const renderCost = () => {
    if (card.type === CARD_TYPES.ENERGY || !card.cost) return null;
    
    return (
      <div className="card-cost">
        {Object.entries(card.cost).map(([energyType, amount]) => (
          <span key={energyType} className={`cost-${energyType}`}>
            {amount}{getEnergyIcon(energyType)}
          </span>
        ))}
      </div>
    );
  };
  
  const renderStats = () => {
    if (card.type !== CARD_TYPES.CREATURE) return null;
    
    const displayHealth = isOnBattlefield && currentHealth !== undefined ? currentHealth : card.health;
    
    return (
      <div className="card-stats">
        <span className="attack">{card.attack}⚔️</span>
        <span className="health">{displayHealth}❤️</span>
      </div>
    );
  };
  
  const renderAbilities = () => {
    if (!card.abilities || card.abilities.length === 0) return null;
    
    return (
      <div className="card-abilities">
        {card.abilities.map((ability, index) => (
          <div key={index} className="ability">
            {ability}
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div 
      className={`card ${getCardTypeClass()} ${getRarityClass(card.rarity)} ${!canPlay ? 'disabled' : ''} ${canAttack ? 'can-attack' : ''} ${isInHand ? 'in-hand' : ''} ${isOnBattlefield ? 'on-battlefield' : ''}`}
      onClick={handleClick}
    >
      {renderCost()}
      
      <div className="card-header">
        <h3 className="card-name">{card.name}</h3>
        <span className="card-type">{card.type}</span>
      </div>
      
      <div className="card-body">
        <p className="card-description">{card.description}</p>
        {renderAbilities()}
      </div>
      
      {renderStats()}
      
      {card.type === CARD_TYPES.ENERGY && (
        <div className="energy-type">
          {getEnergyIcon(card.energyType)}
        </div>
      )}
    </div>
  );
}

export default Card;