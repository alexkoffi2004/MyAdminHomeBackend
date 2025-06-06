const mongoose = require('mongoose');
const Commune = require('../models/Commune');
require('dotenv').config();

const communes = [
  {
    name: 'Abobo',
    description: 'Commune d\'Abobo',
    region: 'Abidjan',
    department: 'Abidjan'
  },
  {
    name: 'Adjamé',
    description: 'Commune d\'Adjamé',
    region: 'Abidjan',
    department: 'Abidjan'
  },
  {
    name: 'Anyama',
    description: 'Commune d\'Anyama',
    region: 'Abidjan',
    department: 'Abidjan'
  },
  {
    name: 'Attécoubé',
    description: 'Commune d\'Attécoubé',
    region: 'Abidjan',
    department: 'Abidjan'
  },
  {
    name: 'Cocody',
    description: 'Commune de Cocody',
    region: 'Abidjan',
    department: 'Abidjan'
  },
  {
    name: 'Koumassi',
    description: 'Commune de Koumassi',
    region: 'Abidjan',
    department: 'Abidjan'
  },
  {
    name: 'Marcory',
    description: 'Commune de Marcory',
    region: 'Abidjan',
    department: 'Abidjan'
  },
  {
    name: 'Plateau',
    description: 'Commune du Plateau',
    region: 'Abidjan',
    department: 'Abidjan'
  },
  {
    name: 'Port-bouet',
    description: 'Commune de Port-bouet',
    region: 'Abidjan',
    department: 'Abidjan'
  },
  {
    name: 'Treichville',
    description: 'Commune de Treichville',
    region: 'Abidjan',
    department: 'Abidjan'
  },
  {
    name: 'Yopougon',
    description: 'Commune de Yopougon',
    region: 'Abidjan',
    department: 'Abidjan'
  }
];

const initCommunes = async () => {
  try {
    // Connexion à la base de données
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Supprimer les communes existantes
    await Commune.deleteMany({});

    // Insérer les nouvelles communes
    await Commune.insertMany(communes);

    console.log('Communes initialisées avec succès');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des communes:', error);
    process.exit(1);
  }
};

initCommunes(); 