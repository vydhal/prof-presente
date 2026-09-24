import face_recognition
import numpy as np
from PIL import Image, ImageOps # Importa ImageOps para correção de EXIF
import requests
import io

MAX_IMAGE_DIMENSION = 1000 # Define um tamanho máximo (ex: 1000 pixels) para redimensionar

def load_and_prepare_image(image_source, is_buffer=False):
    """Carrega imagem de URL ou Buffer, corrige orientação EXIF e redimensiona se necessário."""
    try:
        if is_buffer:
            image = Image.open(io.BytesIO(image_source)).convert('RGB')
        else: # É uma URL
            response = requests.get(image_source, stream=True)
            response.raise_for_status()
            image = Image.open(io.BytesIO(response.content)).convert('RGB')

        # --- CORREÇÃO DE ORIENTAÇÃO EXIF ---
        print("Corrigindo orientação EXIF (se houver)...")
        image = ImageOps.exif_transpose(image)

        # --- REDIMENSIONAMENTO (Opcional, mas recomendado) ---
        width, height = image.size
        if width > MAX_IMAGE_DIMENSION or height > MAX_IMAGE_DIMENSION:
            print(f"Redimensionando imagem de {width}x{height} para max {MAX_IMAGE_DIMENSION}px...")
            image.thumbnail((MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION), Image.Resampling.LANCZOS)
            print(f"Novo tamanho: {image.size[0]}x{image.size[1]}")

        return np.array(image) # Converte para array numpy APÓS os ajustes

    except requests.exceptions.RequestException as e:
        print(f"Erro ao baixar imagem de {image_source if not is_buffer else 'buffer'}: {e}")
        return None
    except Exception as e:
        print(f"Erro ao abrir/processar imagem de {image_source if not is_buffer else 'buffer'}: {e}")
        return None


def get_image_from_url(image_url):
    """Wrapper para carregar e preparar imagem de URL."""
    return load_and_prepare_image(image_url, is_buffer=False)

def get_image_from_buffer(image_buffer):
    """Wrapper para carregar e preparar imagem de Buffer."""
    return load_and_prepare_image(image_buffer, is_buffer=True)


def get_face_descriptor(image_np):
    """Calcula o descritor facial usando HOG."""
    if image_np is None:
        return None
    try:
        print("Detectando faces com HOG (upsample=1)...")
        # Tentamos com upsample=1 primeiro
        face_locations = face_recognition.face_locations(image_np, number_of_times_to_upsample=1, model="hog")

        if not face_locations:
            print("Nenhuma face encontrada (HOG upsample=1).")
            # Poderia adicionar fallback para upsample=0 aqui se quisesse
            return None

        if len(face_locations) > 1:
            print(f"Múltiplas faces ({len(face_locations)}) encontradas, processando a primeira.")

        print("Calculando encoding da face...")
        face_encodings = face_recognition.face_encodings(image_np, known_face_locations=[face_locations[0]], num_jitters=1)

        if face_encodings:
            print("Encoding calculado com sucesso.")
            return face_encodings[0].tolist()
        else:
            print("Não foi possível calcular o encoding da face encontrada.")
            return None
    except Exception as e:
        print(f"Erro no processamento facial (HOG): {e}")
        return None

def find_best_match(descriptor_to_match, known_descriptors_data, tolerance=0.63):
    """Encontra o melhor match para um descritor em uma lista conhecida."""
    # --- AJUSTE AQUI ---
    # Aumentamos a tolerância padrão para 0.6, que é o valor recomendado
    # pela biblioteca face_recognition como um bom ponto de partida.
    # Valores MENORES são MAIS RESTRITOS. Se tiver muitos falsos negativos (não reconhece quem deveria),
    # pode tentar aumentar LIGEIRAMENTE (ex: 0.62). Se tiver falsos positivos (reconhece errado),
    # diminua (ex: 0.55, 0.5).
    print(f"Iniciando busca com tolerância: {tolerance}")

    if descriptor_to_match is None or not known_descriptors_data:
        print("Dados insuficientes para busca (descritor nulo ou lista vazia).")
        return None

    try:
        known_encodings = [np.array(kd['descriptor']) for kd in known_descriptors_data if kd.get('descriptor')] # Garante que descritor existe
        known_user_ids = [kd['userId'] for kd in known_descriptors_data if kd.get('descriptor')]

        if not known_encodings:
             print("Nenhum descritor conhecido válido fornecido.")
             return None

        # Garante que o descritor a comparar tem o formato correto
        target_encoding = np.array(descriptor_to_match)
        if target_encoding.ndim == 0 or target_encoding.size == 0:
             print("Descritor para comparação é inválido.")
             return None

        print(f"Comparando com {len(known_encodings)} descritor(es) conhecido(s).")
        # Compara o descritor a ser comparado com a lista de conhecidos
        matches = face_recognition.compare_faces(known_encodings, target_encoding, tolerance=tolerance)
        face_distances = face_recognition.face_distance(known_encodings, target_encoding)

        best_match_index = -1
        min_distance = 1.0 # Inicializa com valor alto

        # Encontra o índice da menor distância GERAL
        if len(face_distances) > 0:
             min_distance_index_overall = np.argmin(face_distances)
             min_distance = face_distances[min_distance_index_overall]

             # Verifica se o melhor match GERAL está DENTRO da tolerância
             if matches[min_distance_index_overall]:
                  best_match_index = min_distance_index_overall


        if best_match_index != -1:
            best_match_user_id = known_user_ids[best_match_index]
            print(f"Melhor match (Python/HOG): User {best_match_user_id}, Distância: {min_distance:.4f} (Tolerância: {tolerance})")
            return {"userId": best_match_user_id, "distance": min_distance}
        else:
            print(f"Nenhum match encontrado dentro da tolerância {tolerance}. Menor distância encontrada: {min_distance:.4f}")
            return None
    except Exception as e:
        print(f"Erro na comparação facial: {e}")
        return None