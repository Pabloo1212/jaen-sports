/**
 * JaénSports — AI Chat Assistant
 * Floating chat widget with NLP-like responses about the platform
 */

const JaenChatAssistant = (() => {
    let isOpen = false;
    const GREETINGS = [
        '¡Hola! Soy el asistente de JaénSports. ¿En qué puedo ayudarte?',
        'Puedo ayudarte a encontrar partidos, entender cómo funcionan los pagos, o responder cualquier duda sobre la plataforma.'
    ];

    // Intent matching with fuzzy keywords
    const INTENTS = [
        {
            keywords: ['cómo funciona', 'como funciona', 'qué es', 'que es', 'explicar', 'ayuda', 'información'],
            response: 'JaénSports es una plataforma gratuita para organizar y unirte a partidos deportivos en Jaén Capital. Puedes:\n\n• Buscar partidos disponibles filtrados por deporte\n• Crear tu propio partido eligiendo pista, fecha y hora\n• El chat grupal con IA coordina pagos y recordatorios\n• Los cupos se gestionan automáticamente\n\n¿Te gustaría saber más sobre algún tema específico?'
        },
        {
            keywords: ['precio', 'coste', 'cuánto cuesta', 'cuanto cuesta', 'gratis', 'pagar'],
            response: 'La plataforma es 100% gratuita. Solo pagas tu parte del alquiler de la pista, que se divide automáticamente entre todos los jugadores inscritos.\n\nPor ejemplo, si una pista cuesta 45€ y sois 10 jugadores, cada uno paga 4,50€. Puedes pagar cómodamente con Bizum o tarjeta (Stripe).'
        },
        {
            keywords: ['pago', 'bizum', 'stripe', 'tarjeta', 'transferencia'],
            response: 'Aceptamos dos métodos de pago:\n\n💳 Bizum — Pago instantáneo desde tu banco\n💳 Stripe — Visa, Mastercard, American Express\n\nEl coste se calcula automáticamente dividiendo el precio de la pista entre los jugadores inscritos. Además, envío recordatorios automáticos si alguien no ha pagado.'
        },
        {
            keywords: ['fútbol sala', 'futbol sala', 'futsal', 'sala'],
            response: 'Tenemos bastantes partidos de fútbol en Jaén cada semana. Se juegan principalmente en:\n\n• Pabellón Salobreja (Fútbol Sala)\n• Pabellón y pistas de Fuentezuelas (Fútbol Sala, F11, F7)\n• Campo fútbol 7 Salobreja (F7)\n\n¿Quieres que te lleve a la página de partidos disponibles?'
        },
        {
            keywords: ['fútbol 11', 'futbol 11', 'once', 'campo grande'],
            response: 'Los partidos de fútbol 11 (22 jugadores) se organizan en:\n\n• Campo de fútbol Fuentezuelas\n\nEl coste por jugador es muy bajo al dividirse entre 22. ¡Mira los partidos disponibles!'
        },
        {
            keywords: ['fútbol 7', 'futbol 7', 'siete'],
            response: 'Para fútbol 7 solemos jugar 14 personas. Las pistas más habituales en JaénSports son:\n\n• Campo fútbol 7 Salobreja\n• Campos nº 1 y nº 2 de Fuentezuelas\n\n¿Buscas un partido para esta semana? ¡Busca partidos disponibles o crea el tuyo!'
        },
        {
            keywords: ['pádel', 'padel'],
            response: 'Los partidos de pádel son para 4 jugadores. La pista principal es el Club Pádel Jaén:\n\n• Club Pádel Jaén — 20€/h, cubierta, iluminación\n\nA solo 5€ por persona. ¡Busca partidos disponibles o crea el tuyo!'
        },
        {
            keywords: ['cancelar', 'anular', 'darme de baja', 'salir', 'no puedo ir'],
            response: 'Puedes cancelar tu inscripción en cualquier momento desde tu perfil o la página del partido. La plaza se reabre automáticamente y se notifica al grupo.\n\nImportante: si cancelas con menos de 4 horas de antelación, se reflejará en tu puntuación de fiabilidad.'
        },
        {
            keywords: ['chat', 'grupo', 'hablar', 'mensaje', 'coordinar'],
            response: 'Cada partido tiene un chat grupal donde los jugadores se coordinan. Como asistente IA:\n\n• Envío recordatorios de horario y pago\n• Resumo conversaciones largas\n• Sugiero quién puede reservar la pista\n• Informo cuando se abren o cierran plazas\n\nEl chat se activa automáticamente cuando creas o te unes a un partido.'
        },
        {
            keywords: ['pista', 'instalación', 'reservar', 'patronato', 'reserva'],
            response: 'Las reservas de pista se hacen directamente en la web del Patronato Municipal de Deportes de Jaén. Nosotros coordinamos los grupos de jugadores a través de la web.\n\nPistas habilitadas:\n• Pabellón y pistas de Salobreja\n• Pabellón y pistas de Fuentezuelas\n• Campo fútbol 7 Salobreja\n\nEnlace reservas: https://dmzwin.aytojaen.es/CronosWeb/Modulos/VentaServicios/Alquileres/ConsultaEspacios?token=EFDE972163E5BB6DD0398567CB41EBF5'
        },
        {
            keywords: ['crear', 'organizar', 'nuevo partido', 'montar'],
            response: '¡Crear un partido es muy fácil! Solo necesitas 4 pasos:\n\n1. Elige el deporte\n2. Selecciona la pista\n3. Configura fecha, hora y precio\n4. Publica y ¡listo!\n\nLos jugadores se inscribirán solos y el cupo se gestiona automáticamente. ¿Quieres crear uno ahora?'
        },
        {
            keywords: ['perfil', 'cuenta', 'estadísticas', 'historial'],
            response: 'En tu perfil puedes ver:\n\n• Partidos jugados y organizados\n• Tu puntuación de fiabilidad\n• Historial de pagos\n• Próximos partidos\n• Configuración de notificaciones\n\nAccede desde "Mi Perfil" en el menú superior.'
        },
        {
            keywords: ['jaén', 'jaen', 'ciudad', 'local'],
            response: 'JaénSports nace en Jaén Capital con vocación de expandirse a otras ciudades andaluzas. Actualmente cubrimos las principales instalaciones deportivas municipales del Patronato de Deportes y algunos clubes privados.\n\n¡Estamos creciendo cada día con más jugadores y deportes!'
        },
        {
            keywords: ['hola', 'buenas', 'hey', 'hello', 'saludos'],
            response: '¡Hola! Bienvenido a JaénSports. Estoy aquí para ayudarte. Puedo responderte sobre:\n\n• Cómo funciona la plataforma\n• Partidos disponibles\n• Precios y métodos de pago\n• Pistas en Jaén\n• Cómo crear un partido\n\n¿Qué te gustaría saber?'
        }
    ];

    const FALLBACK = 'No estoy seguro de entender tu pregunta. Puedo ayudarte con:\n\n• Cómo funciona JaénSports\n• Partidos disponibles\n• Precios y pagos\n• Pistas en Jaén\n• Crear un partido\n• Cancelaciones\n\nIntenta reformular tu pregunta o visita nuestra sección de FAQ.';

    function matchIntent(text) {
        const lower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        let bestMatch = null;
        let bestScore = 0;

        for (const intent of INTENTS) {
            let score = 0;
            for (const keyword of intent.keywords) {
                const normalizedKeyword = keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                if (lower.includes(normalizedKeyword)) score += normalizedKeyword.length;
            }
            if (score > bestScore) { bestScore = score; bestMatch = intent; }
        }

        return bestScore > 2 ? bestMatch.response : FALLBACK;
    }

    function init() {
        const fab = document.getElementById('chat-fab');
        const panel = document.getElementById('chat-panel');
        const closeBtn = document.getElementById('chat-close');
        const input = document.getElementById('chat-input');
        const sendBtn = document.getElementById('chat-send');
        const messages = document.getElementById('chat-messages');

        if (!fab || !panel) return;

        // Toggle chat
        fab.addEventListener('click', () => {
            isOpen = !isOpen;
            panel.classList.toggle('open', isOpen);
            if (isOpen && messages.children.length === 0) {
                GREETINGS.forEach((msg, i) => {
                    setTimeout(() => addMessage(msg, 'bot'), i * 600);
                });
            }
            if (isOpen) setTimeout(() => input.focus(), 300);
        });

        closeBtn?.addEventListener('click', () => {
            isOpen = false;
            panel.classList.remove('open');
        });

        // Send message
        const send = () => {
            const text = input.value.trim();
            if (!text) return;
            addMessage(text, 'user');
            input.value = '';

            // Simulate typing
            setTimeout(() => {
                const response = matchIntent(text);
                addMessage(response, 'bot');
            }, 500 + Math.random() * 800);
        };

        sendBtn?.addEventListener('click', send);
        input?.addEventListener('keypress', (e) => { if (e.key === 'Enter') send(); });
    }

    function addMessage(text, sender) {
        const messages = document.getElementById('chat-messages');
        if (!messages) return;
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${sender}`;
        bubble.textContent = text;
        messages.appendChild(bubble);
        messages.scrollTop = messages.scrollHeight;
    }

    return { init, matchIntent, addMessage };
})();

document.addEventListener('DOMContentLoaded', () => JaenChatAssistant.init());
