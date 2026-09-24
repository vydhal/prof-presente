# facial-recognition-service-py/app.py
from flask import Flask, request, jsonify
import face_processor
import os
import json # Importa json para a rota /search-face
import face_recognition # <<< --- ADICIONE ESTA LINHA --- <<<

app = Flask(__name__)

models_loaded = False

def check_models():
    """Verifica se a biblioteca face_recognition está acessível."""
    global models_loaded
    if not models_loaded:
        try:
            # Tenta acessar algo básico da API importada
            _ = face_recognition.api # Acessa algo da API importada agora
            models_loaded = True
            print("Modelos face_recognition parecem estar acessíveis.")
        except Exception as e:
            print(f"ERRO CRÍTICO ao acessar modelos face_recognition: {e}")
            models_loaded = False
    return models_loaded


@app.route('/health')
def health_check():
    if check_models():
         return "OK", 200
    else:
         # Retorna 503 Service Unavailable se os modelos não carregaram
         return "Model Loading Failed", 503


@app.route('/api/index-face', methods=['POST'])
def index_face():
    # Adiciona a verificação no início da rota também
    if not models_loaded: return jsonify({"error": "Serviço indisponível (modelos não carregados)"}), 503

    data = request.get_json()
    user_id = data.get('userId')
    photo_url = data.get('photoUrl')
    public_api_url = os.environ.get('PUBLIC_API_URL', '')

    if not user_id or not photo_url:
        return jsonify({"error": "userId e photoUrl são obrigatórios."}), 400

    full_url = photo_url if photo_url.startswith('http') else f"{public_api_url}{photo_url}"

    image_np = face_processor.get_image_from_url(full_url)
    if image_np is None:
        return jsonify({"error": "Não foi possível carregar a imagem da URL."}), 400

    descriptor = face_processor.get_face_descriptor(image_np)

    if descriptor:
        return jsonify({"userId": user_id, "descriptor": descriptor})
    else:
        return jsonify({"error": "Nenhuma face detectada ou erro no processamento."}), 404

@app.route('/api/search-face', methods=['POST'])
def search_face():
    # Adiciona a verificação no início da rota também
    if not models_loaded: return jsonify({"error": "Serviço indisponível (modelos não carregados)"}), 503

    try:
        known_descriptors_str = request.args.get('knownDescriptors', '[]')
        # Garante que a string seja tratada corretamente antes do parse
        known_descriptors = json.loads(known_descriptors_str)
        image_buffer = request.get_data()

        if not image_buffer:
            return jsonify({"error": "Imagem para busca é obrigatória."}), 400
        if not isinstance(known_descriptors, list):
             return jsonify({"error": "knownDescriptors deve ser um array JSON."}), 400

        image_np = face_processor.get_image_from_buffer(image_buffer)
        if image_np is None:
            return jsonify({"error": "Não foi possível carregar a imagem enviada."}), 400

        descriptor_to_match = face_processor.get_face_descriptor(image_np)
        if descriptor_to_match is None:
             return jsonify({"error": "Nenhuma face detectada na imagem enviada."}), 404

        best_match = face_processor.find_best_match(descriptor_to_match, known_descriptors, tolerance=0.55)

        if best_match:
            return jsonify({"matchedUserId": best_match['userId'], "distance": best_match['distance']})
        else:
            return jsonify({"error": "Nenhum match encontrado com confiança suficiente."}), 404

    except json.JSONDecodeError:
         return jsonify({"error": "Formato inválido para knownDescriptors na query string."}), 400
    except Exception as e:
        print(f"Erro em /search-face: {e}")
        return jsonify({"error": "Erro interno no processamento da busca facial."}), 500

if __name__ == '__main__':
    check_models() # Tenta carregar/verificar modelos na inicialização
    port = int(os.environ.get('PORT', 3002))
    # Para produção, use Gunicorn ou outro servidor WSGI
    app.run(host='0.0.0.0', port=port)