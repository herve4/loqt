
import { GoogleGenAI, Type } from "@google/genai";
import { Material, EventLogistics } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getLogisticsInsights(events: EventLogistics[], materials: Material[]) {
  const prompt = `
    Analysez les données logistiques suivantes et fournissez 3 informations stratégiques clés pour une application nommée "LOQT".
    Événements: ${JSON.stringify(events)}
    Matériels: ${JSON.stringify(materials)}
    
    Répondez en FRANÇAIS. Format de réponse JSON avec les champs : 'insights' (tableau de chaînes) et 'summary' (chaîne).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insights: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            summary: { type: Type.STRING }
          },
          required: ["insights", "summary"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      insights: [
        "Vérifiez les niveaux de stock pour les festivals à venir.",
        "Planifiez la maintenance des équipements audio.",
        "Optimisez les itinéraires de transport entre Paris et Lyon."
      ],
      summary: "L'assistant IA est prêt à vous aider à optimiser vos opérations."
    };
  }
}

export async function suggestEquipmentForEvent(eventName: string, attendees: number) {
  const prompt = `Suggérez une liste d'équipements logistiques essentiels pour un événement nommé "${eventName}" avec ${attendees} participants. Fournissez une brève explication pour chaque élément dans un ton professionnel. RÉPONDEZ EN FRANÇAIS.`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return "Suggestion indisponible. Veuillez vérifier votre connexion réseau.";
  }
}

export async function chatWithAssistant(history: {role: 'user' | 'model', text: string}[], message: string) {
  try {
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: "Vous êtes LOQT-AI, un assistant logistique professionnel. Vous aidez les gestionnaires à suivre l'inventaire, optimiser les itinéraires et planifier l'équipement des événements. Soyez concis et professionnel. RÉPONDEZ TOUJOURS EN FRANÇAIS.",
      },
    });
    
    const response = await chat.sendMessage({ message });
    return response.text;
  } catch (error) {
    console.error("Chat Error:", error);
    return "J'ai du mal à me connecter à la base de connaissances LOQT. Comment puis-je vous aider autrement ?";
  }
}
