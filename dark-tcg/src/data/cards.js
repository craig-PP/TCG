// Card types
export const CARD_TYPES = {
  CREATURE: 'creature',
  SPELL: 'spell',
  ENERGY: 'energy'
};

// Energy types
export const ENERGY_TYPES = {
  SHADOW: 'shadow',
  BLOOD: 'blood',  
  BONE: 'bone',
  SPIRIT: 'spirit'
};

// Card database
export const CARDS = {
  // Energy Cards
  shadow_energy: {
    id: 'shadow_energy',
    name: 'Shadow Energy',
    type: CARD_TYPES.ENERGY,
    energyType: ENERGY_TYPES.SHADOW,
    cost: 0,
    description: 'Provides 1 Shadow energy',
    rarity: 'common'
  },
  
  blood_energy: {
    id: 'blood_energy',
    name: 'Blood Energy',
    type: CARD_TYPES.ENERGY,
    energyType: ENERGY_TYPES.BLOOD,
    cost: 0,
    description: 'Provides 1 Blood energy',
    rarity: 'common'
  },
  
  bone_energy: {
    id: 'bone_energy',
    name: 'Bone Energy',
    type: CARD_TYPES.ENERGY,
    energyType: ENERGY_TYPES.BONE,
    cost: 0,
    description: 'Provides 1 Bone energy',
    rarity: 'common'
  },
  
  spirit_energy: {
    id: 'spirit_energy',
    name: 'Spirit Energy',
    type: CARD_TYPES.ENERGY,
    energyType: ENERGY_TYPES.SPIRIT,
    cost: 0,
    description: 'Provides 1 Spirit energy',
    rarity: 'common'
  },

  // Creatures
  skeletal_warrior: {
    id: 'skeletal_warrior',
    name: 'Skeletal Warrior',
    type: CARD_TYPES.CREATURE,
    cost: { [ENERGY_TYPES.BONE]: 1 },
    attack: 2,
    health: 1,
    description: 'A fallen warrior, bound to serve in undeath.',
    rarity: 'common'
  },
  
  shadow_wraith: {
    id: 'shadow_wraith',
    name: 'Shadow Wraith',
    type: CARD_TYPES.CREATURE,
    cost: { [ENERGY_TYPES.SHADOW]: 1 },
    attack: 1,
    health: 2,
    description: 'A creature of pure darkness that feeds on fear.',
    rarity: 'common',
    abilities: ['When played, opponent discards 1 card']
  },
  
  blood_cultist: {
    id: 'blood_cultist',
    name: 'Blood Cultist',
    type: CARD_TYPES.CREATURE,
    cost: { [ENERGY_TYPES.BLOOD]: 1 },
    attack: 1,
    health: 1,
    description: 'Devoted to dark rituals and forbidden magic.',
    rarity: 'common',
    abilities: ['When played, gain 1 health']
  },
  
  vengeful_spirit: {
    id: 'vengeful_spirit',
    name: 'Vengeful Spirit',
    type: CARD_TYPES.CREATURE,
    cost: { [ENERGY_TYPES.SPIRIT]: 2 },
    attack: 2,
    health: 2,
    description: 'The restless soul of someone wronged in life.',
    rarity: 'common',
    abilities: ['Cannot be blocked by creatures with 1 attack']
  },
  
  plague_bearer: {
    id: 'plague_bearer',
    name: 'Plague Bearer',
    type: CARD_TYPES.CREATURE,
    cost: { [ENERGY_TYPES.BONE]: 2, [ENERGY_TYPES.BLOOD]: 1 },
    attack: 3,
    health: 2,
    description: 'A walking disease that spreads corruption.',
    rarity: 'uncommon',
    abilities: ['When this creature dies, deal 1 damage to all enemy creatures']
  },
  
  shadow_assassin: {
    id: 'shadow_assassin',
    name: 'Shadow Assassin',
    type: CARD_TYPES.CREATURE,
    cost: { [ENERGY_TYPES.SHADOW]: 2 },
    attack: 3,
    health: 1,
    description: 'Strikes quickly from the darkness.',
    rarity: 'uncommon',
    abilities: ['Quick Strike: Can attack immediately when played']
  },
  
  ancient_lich: {
    id: 'ancient_lich',
    name: 'Ancient Lich',
    type: CARD_TYPES.CREATURE,
    cost: { [ENERGY_TYPES.BONE]: 3, [ENERGY_TYPES.SPIRIT]: 2 },
    attack: 4,
    health: 4,
    description: 'A powerful undead sorcerer with centuries of dark knowledge.',
    rarity: 'rare',
    abilities: ['When played, return target creature from your discard pile to your hand']
  },
  
  demon_lord: {
    id: 'demon_lord',
    name: 'Demon Lord',
    type: CARD_TYPES.CREATURE,
    cost: { [ENERGY_TYPES.BLOOD]: 4, [ENERGY_TYPES.SHADOW]: 1 },
    attack: 5,
    health: 3,
    description: 'A fearsome demon from the deepest pits of hell.',
    rarity: 'rare',
    abilities: ['When played, deal 2 damage to target enemy creature']
  },
  
  // Spell Cards
  dark_ritual: {
    id: 'dark_ritual',
    name: 'Dark Ritual',
    type: CARD_TYPES.SPELL,
    cost: { [ENERGY_TYPES.SHADOW]: 1 },
    description: 'Gain 2 additional energy this turn.',
    rarity: 'common',
    effect: 'gain_energy'
  },
  
  drain_life: {
    id: 'drain_life',
    name: 'Drain Life',
    type: CARD_TYPES.SPELL,
    cost: { [ENERGY_TYPES.BLOOD]: 2 },
    description: 'Deal 3 damage to target creature. Gain 3 health.',
    rarity: 'common',
    effect: 'drain'
  },
  
  bone_armor: {
    id: 'bone_armor',
    name: 'Bone Armor',
    type: CARD_TYPES.SPELL,
    cost: { [ENERGY_TYPES.BONE]: 1 },
    description: 'Target creature gains +0/+2 and cannot be targeted by spells.',
    rarity: 'common',
    effect: 'buff_defense'
  },
  
  soul_burn: {
    id: 'soul_burn',
    name: 'Soul Burn',
    type: CARD_TYPES.SPELL,
    cost: { [ENERGY_TYPES.SPIRIT]: 2, [ENERGY_TYPES.SHADOW]: 1 },
    description: 'Deal 4 damage to target creature or player.',
    rarity: 'uncommon',
    effect: 'damage'
  },
  
  necromancy: {
    id: 'necromancy',
    name: 'Necromancy',
    type: CARD_TYPES.SPELL,
    cost: { [ENERGY_TYPES.BONE]: 3, [ENERGY_TYPES.SPIRIT]: 1 },
    description: 'Return target creature from any discard pile to the battlefield under your control.',
    rarity: 'rare',
    effect: 'resurrect'
  }
};

// Pre-built starter decks
export const STARTER_DECKS = {
  shadow_deck: {
    name: "Shadow Corruption",
    cards: [
      // Energy (8 cards)
      'shadow_energy', 'shadow_energy', 'shadow_energy', 'shadow_energy',
      'spirit_energy', 'spirit_energy', 'bone_energy', 'bone_energy',
      
      // Creatures (9 cards)
      'shadow_wraith', 'shadow_wraith', 'shadow_assassin', 'shadow_assassin',
      'vengeful_spirit', 'vengeful_spirit', 'skeletal_warrior', 'skeletal_warrior',
      'ancient_lich',
      
      // Spells (3 cards)
      'dark_ritual', 'soul_burn', 'necromancy'
    ]
  },
  
  blood_deck: {
    name: "Blood Sacrifice",
    cards: [
      // Energy (8 cards)
      'blood_energy', 'blood_energy', 'blood_energy', 'blood_energy',
      'bone_energy', 'bone_energy', 'shadow_energy', 'shadow_energy',
      
      // Creatures (9 cards)
      'blood_cultist', 'blood_cultist', 'blood_cultist', 'plague_bearer',
      'plague_bearer', 'demon_lord', 'skeletal_warrior', 'skeletal_warrior',
      'shadow_wraith',
      
      // Spells (3 cards)
      'drain_life', 'drain_life', 'dark_ritual'
    ]
  }
};