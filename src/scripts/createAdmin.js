require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const createAdmin = async () => {
  try {
    // Connexion à MongoDB
    const mongoURI = process.env.MONGODB_URI.replace('test', 'MyAdminHome');
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'MyAdminHome'
    });
    console.log('Connecté à MongoDB');

    // Données de l'administrateur
    const adminData = {
      firstName: 'Admin',
      lastName: 'System',
      email: 'admin@myadminhome.com',
      password: 'Admin123!',
      phone: '+225 0700000000',
      address: 'Abidjan, Côte d\'Ivoire',
      role: 'admin'
    };

    // Vérifier si l'admin existe déjà
    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log('Un administrateur avec cet email existe déjà');
      process.exit(0);
    }

    // Créer le nouvel administrateur
    const admin = await User.create(adminData);
    console.log('Administrateur créé avec succès:', {
      id: admin._id,
      email: admin.email,
      role: admin.role
    });

    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la création de l\'administrateur:', error);
    process.exit(1);
  }
};

createAdmin(); 