from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from ..models import Evenement
from django.utils.dateparse import parse_datetime

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_event_date(request, pk):
    """
    Met à jour la date de début et de fin d'un événement (pour le drag-and-drop).
    """
    try:
        event = Evenement.objects.get(pk=pk)
    except Evenement.DoesNotExist:
        return Response({'status': 'error', 'message': 'Événement non trouvé.'}, status=status.HTTP_404_NOT_FOUND)

    # Vérifier les permissions (par exemple, seul l'organisateur ou un admin peut modifier)
    if not (request.user == event.organisateur or request.user.is_staff):
        return Response({'status': 'error', 'message': 'Permission refusée.'}, status=status.HTTP_403_FORBIDDEN)

    start_date_str = request.data.get('start')
    end_date_str = request.data.get('end')

    if not start_date_str:
        return Response({'status': 'error', 'message': 'La date de début est requise.'}, status=status.HTTP_400_BAD_REQUEST)

    start_date = parse_datetime(start_date_str)
    # FullCalendar peut ne pas envoyer de date de fin pour les événements d'une journée
    end_date = parse_datetime(end_date_str) if end_date_str else start_date

    if not start_date:
        return Response({'status': 'error', 'message': 'Format de date de début invalide.'}, status=status.HTTP_400_BAD_REQUEST)

    event.date_debut = start_date
    event.date_fin = end_date
    event.save()

    return Response({'status': 'success', 'message': 'Date mise à jour avec succès.'})
