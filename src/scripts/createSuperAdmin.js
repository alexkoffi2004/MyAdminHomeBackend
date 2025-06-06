require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const createSuperAdmin = async () => {
  try {
    // Connexion à la base de données
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Vérifier si un super admin existe déjà
    const superAdminExists = await User.findOne({ role: 'super_admin' });
    if (superAdminExists) {
      console.log('Un super administrateur existe déjà');
      process.exit(0);
    }

    // Créer le super admin
    const superAdmin = await User.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'superadmin@myadminhome.com',
      password: 'superadmin123', // À changer immédiatement après la première connexion
      role: 'super_admin',
      phoneNumber: '+221 77 123 4567'
    });

    console.log('Super administrateur créé avec succès :');
    console.log({
      id: superAdmin._id,
      firstName: superAdmin.firstName,
      lastName: superAdmin.lastName,
      email: superAdmin.email,
      role: superAdmin.role
    });

    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la création du super administrateur :', error);
    process.exit(1);
  }
};

createSuperAdmin(); 