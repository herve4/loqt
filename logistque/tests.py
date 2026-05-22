from django.test import TestCase
from django.contrib.auth import get_user_model
from logistque.models import (
    Region, Ville, Eglise
)

User = get_user_model()

# class EvenementModelTest(TestCase):
#     @classmethod
#     def setUpTestData(cls):
#         # Création des données de test
#         cls.region = Region.objects.create(nom="Région Test")
#         cls.ville = Ville.objects.create(nom="Ville Test", region=cls.region)
        
#         # Création d'un utilisateur
#         cls.user = User.objects.create_user(
#             username='testuser',
#             email='test@example.com',
#             password='testpass123',
#             first_name='Test',
#             last_name='User'
#         )
        
#         # Création d'une église
#         cls.eglise = Eglise.objects.create(
#             nom="Église Test",
#             ville=cls.ville,
#             phone='+2250102030405'
#         )
        
#         # Création de la logistique
#         cls.logistique = Logistique.objects.create(
#             eglise=cls.eglise,
#             responsable=cls.user
#         )
        
#         # Création d'une catégorie et sous-catégorie de matériel
#         cls.categorie = CategorieMateriel.objects.create(nom="Catégorie Test")
#         cls.sous_categorie = SousCategorieMateriel.objects.create(
#             categorie=cls.categorie,
#             nom="Sous-catégorie Test"
#         )
        
#         # Création d'un matériel
#         cls.materiel = Materiel.objects.create(
#             nom="Matériel Test",
#             categorie=cls.categorie,
#             sous_categorie=cls.sous_categorie,
#             quantite=10,
#             logistique=cls.logistique,
#             eglise=cls.eglise
#         )
    
#     def test_create_evenement_valide(self):
#         """Test la création d'un événement valide"""
#         evenement = Evenement.objects.create(
#             titre="Événement Test",
#             type_evenement="conference",
#             organisateur_type="eglise",
#             eglise=self.eglise,
#             date_debut=timezone.now() + timedelta(days=1),
#             date_fin=timezone.now() + timedelta(days=2),
#             description="Description de test",
#             created_by=self.user
#         )
#         evenement.logisticiens_gestion.add(self.user)
#         evenement.materiels_utilises.add(self.materiel)
        
#         self.assertEqual(str(evenement), f"Événement Test (Conférence) - {(timezone.now() + timedelta(days=1)).strftime('%d/%m/%Y')}")
#         self.assertEqual(evenement.logisticiens_gestion.count(), 1)
#         self.assertEqual(evenement.materiels_utilises.count(), 1)
    
#     def test_date_fin_avant_date_debut(self):
#         """Test la validation de la date de fin avant la date de début"""
#         with self.assertRaises(ValidationError):
#             evenement = Evenement(
#                 titre="Événement Invalide",
#                 type_evenement="conference",
#                 organisateur_type="eglise",
#                 eglise=self.eglise,
#                 date_debut=timezone.now() + timedelta(days=2),
#                 date_fin=timezone.now() + timedelta(days=1),
#                 created_by=self.user
#             )
#             evenement.full_clean()
    
#     def test_organisateur_eglise_sans_eglise(self):
#         """Test la validation d'un organisateur église sans église spécifiée"""
#         with self.assertRaises(ValidationError):
#             evenement = Evenement(
#                 titre="Événement Invalide",
#                 type_evenement="conference",
#                 organisateur_type="eglise",
#                 date_debut=timezone.now() + timedelta(days=1),
#                 date_fin=timezone.now() + timedelta(days=2),
#                 created_by=self.user
#             )
#             evenement.full_clean()


# class EvenementMaterielModelTest(TestCase):
#     @classmethod
#     def setUpTestData(cls):
#         # Réutiliser la configuration de base de EvenementModelTest
#         cls.region = Region.objects.create(nom="Région Test")
#         cls.ville = Ville.objects.create(nom="Ville Test", region=cls.region)
#         cls.user = User.objects.create_user(
#             username='testuser',
#             email='test@example.com',
#             password='testpass123'
#         )
#         cls.eglise = Eglise.objects.create(
#             nom="Église Test",
#             ville=cls.ville,
#             phone='+2250102030405'
#         )
#         cls.logistique = Logistique.objects.create(
#             eglise=cls.eglise,
#             responsable=cls.user
#         )
#         cls.categorie = CategorieMateriel.objects.create(nom="Catégorie Test")
#         cls.sous_categorie = SousCategorieMateriel.objects.create(
#             categorie=cls.categorie,
#             nom="Sous-catégorie Test"
#         )
        
#         # Créer un matériel avec une quantité limitée
#         cls.materiel = Materiel.objects.create(
#             nom="Matériel Test",
#             categorie=cls.categorie,
#             sous_categorie=cls.sous_categorie,
#             quantite=5,  # Seulement 5 unités disponibles
#             quantite_disponible=5,
#             logistique=cls.logistique,
#             eglise=cls.eglise
#         )
        
#         # Créer un événement
#         cls.evenement = Evenement.objects.create(
#             titre="Événement Test",
#             type_evenement="conference",
#             organisateur_type="eglise",
#             eglise=cls.eglise,
#             date_debut=timezone.now() + timedelta(days=1),
#             date_fin=timezone.now() + timedelta(days=2),
#             created_by=cls.user
#         )
    
#     def test_creer_reservation_valide(self):
#         """Test la création d'une réservation de matériel valide"""
#         reservation = EvenementMateriel.objects.create(
#             evenement=self.evenement,
#             materiel=self.materiel,
#             quantite=3,
#             ajoute_par=self.user
#         )
        
#         # Vérifier que la quantité disponible a été mise à jour
#         self.materiel.refresh_from_db()
#         self.assertEqual(self.materiel.quantite_disponible, 2)  # 5 - 3 = 2
        
#         # Vérifier que la réservation peut être supprimée
#         reservation.delete()
#         self.materiel.refresh_from_db()
#         self.assertEqual(self.materiel.quantite_disponible, 5)  # Doit revenir à 5
    
#     def test_quantite_superieure_stock(self):
#         """Test qu'on ne peut pas réserver plus que le stock disponible"""
#         with self.assertRaises(ValidationError):
#             reservation = EvenementMateriel(
#                 evenement=self.evenement,
#                 materiel=self.materiel,
#                 quantite=10,  # Plus que les 5 disponibles
#                 ajoute_par=self.user
#             )
#             reservation.full_clean()
    
#     def test_conflit_dates(self):
#         """Test qu'on ne peut pas réserver le même matériel sur des dates qui se chevauchent"""
#         # Créer un premier événement avec réservation
#         EvenementMateriel.objects.create(
#             evenement=self.evenement,
#             materiel=self.materiel,
#             quantite=2,
#             ajoute_par=self.user
#         )
        
#         # Créer un deuxième événement qui chevauche le premier
#         evenement2 = Evenement.objects.create(
#             titre="Autre Événement",
#             type_evenement="seminaire",
#             organisateur_type="eglise",
#             eglise=self.eglise,
#             date_debut=timezone.now() + timedelta(days=1, hours=12),  # Chevauche
#             date_fin=timezone.now() + timedelta(days=2, hours=12),
#             created_by=self.user
#         )
        
#         # Tenter de réserver le même matériel devrait échouer
#         with self.assertRaises(ValidationError):
#             reservation = EvenementMateriel(
#                 evenement=evenement2,
#                 materiel=self.materiel,
#                 quantite=2,
#                 ajoute_par=self.user
#             )
#             reservation.full_clean()


# class ChronogrammeItemModelTest(TestCase):
#     @classmethod
#     def setUpTestData(cls):
#         # Configuration de base similaire aux tests précédents
#         cls.region = Region.objects.create(nom="Région Test")
#         cls.ville = Ville.objects.create(nom="Ville Test", region=cls.region)
#         cls.user = User.objects.create_user(
#             username='testuser',
#             email='test@example.com',
#             password='testpass123'
#         )
#         cls.eglise = Eglise.objects.create(
#             nom="Église Test",
#             ville=cls.ville,
#             phone='+2250102030405'
#         )
#         cls.logistique = Logistique.objects.create(
#             eglise=cls.eglise,
#             responsable=cls.user
#         )
        
#         # Créer un événement
#         cls.evenement = Evenement.objects.create(
#             titre="Événement Test",
#             type_evenement="conference",
#             organisateur_type="eglise",
#             eglise=cls.eglise,
#             date_debut=timezone.now() + timedelta(days=1),
#             date_fin=timezone.now() + timedelta(days=2),
#             created_by=cls.user
#         )
    
#     def test_creer_activite_valide(self):
#         """Test la création d'une activité valide dans le chronogramme"""
#         activite = ChronogrammeItem.objects.create(
#             evenement=self.evenement,
#             titre="Séance d'ouverture",
#             description="Mot de bienvenue et présentation",
#             heure_debut=time(9, 0),
#             heure_fin=time(10, 30),
#             responsable="John Doe",
#             cree_par=self.user
#         )
        
#         self.assertEqual(str(activite), "Séance d'ouverture (09:00-10:30)")
#         self.assertEqual(activite.duree, 90)  # 1h30 = 90 minutes
#         self.assertEqual(activite.duree_formatee, "1h30")
    
#     def test_heure_fin_avant_heure_debut(self):
#         """Test qu'on ne peut pas créer une activité avec une heure de fin avant l'heure de début"""
#         with self.assertRaises(ValidationError):
#             activite = ChronogrammeItem(
#                 evenement=self.evenement,
#                 titre="Activité Invalide",
#                 heure_debut=time(10, 0),
#                 heure_fin=time(9, 0),  # Avant l'heure de début
#                 cree_par=self.user
#             )
#             activite.full_clean()
    
#     def test_chevauchement_activites(self):
#         """Test qu'on ne peut pas créer deux activités qui se chevauchent"""
#         # Créer une première activité
#         ChronogrammeItem.objects.create(
#             evenement=self.evenement,
#             titre="Première Activité",
#             heure_debut=time(9, 0),
#             heure_fin=time(10, 0),
#             cree_par=self.user
#         )
        
#         # Tenter de créer une activité qui chevauche la première
#         with self.assertRaises(ValidationError):
#             activite = ChronogrammeItem(
#                 evenement=self.evenement,
#                 titre="Deuxième Activité",
#                 heure_debut=time(9, 30),  # Chevauche avec la première
#                 heure_fin=time(10, 30),
#                 cree_par=self.user
#             )
#             activite.full_clean()
    
#     def test_get_materiels_disponibles(self):
#         """Test la récupération des matériels disponibles pour une activité"""
#         # Créer un matériel de test
#         categorie = CategorieMateriel.objects.create(nom="Catégorie Test")
#         sous_categorie = SousCategorieMateriel.objects.create(
#             categorie=categorie,
#             nom="Sous-catégorie Test"
#         )
#         materiel = Materiel.objects.create(
#             nom="Matériel Test",
#             categorie=categorie,
#             sous_categorie=sous_categorie,
#             quantite=5,
#             quantite_disponible=5,
#             logistique=self.logistique,
#             eglise=self.eglise
#         )
        
#         # Créer une activité
#         activite = ChronogrammeItem.objects.create(
#             evenement=self.evenement,
#             titre="Activité Test",
#             heure_debut=time(11, 0),
#             heure_fin=time(12, 0),
#             cree_par=self.user
#         )
        
#         # Vérifier que le matériel est disponible
#         materiels_dispos = activite.get_materiels_disponibles()
#         self.assertEqual(materiels_dispos.count(), 1)
#         self.assertEqual(materiels_dispos.first(), materiel)
        
#         # Réserver le matériel pour une autre activité
#         autre_activite = ChronogrammeItem.objects.create(
#             evenement=self.evenement,
#             titre="Autre Activité",
#             heure_debut=time(13, 0),
#             heure_fin=time(14, 0),
#             cree_par=self.user
#         )
#         autre_activite.materiels_needed.add(materiel)
        
#         # Vérifier que le matériel n'est plus disponible pour une activité qui chevauche
#         activite_chevauchement = ChronogrammeItem(
#             evenement=self.evenement,
#             titre="Activité Chevauchante",
#             heure_debut=time(13, 30),
#             heure_fin=time(14, 30),
#             cree_par=self.user
#         )
#         materiels_dispos = activite_chevauchement.get_materiels_disponibles()
#         self.assertEqual(materiels_dispos.count(), 0)  # Aucun matériel disponible


class EgliseCreateTest(TestCase):
    def test_create_eglise(self):
        eglise = Eglise.objects.create(
            nom="Église Test",
            ville=Ville.objects.create(nom="Ville Test", region=Region.objects.create(nom="Région Test")),
            phone='+2250102030405',
            email='test@example.com',
            adresse='123 Rue Test',
            latitude=12.3456,
            longitude=78.9012,
            created_by=User.objects.create_user(
                username='testuser',
                email='test@example.com',
                password='testpass123'
            )    
        )
        self.assertEqual(str(eglise), "Église Test")