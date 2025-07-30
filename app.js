// Configuração da API Gemini
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";
const API_KEY = "AIzaSyA9LX0mFFWTLy48xT2v6dMMlt2PCDF3yQ0";

// Elementos do DOM
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const voiceToggle = document.getElementById('voice-toggle');
const voiceIcon = document.getElementById('voice-icon');
const languageToggle = document.getElementById('language-toggle');
const languageFlag = document.getElementById('language-flag');
const languageText = document.getElementById('language-text');
const clearChat = document.getElementById('clear-chat');
const loading = document.getElementById('loading');
const status = document.getElementById('status');
const teslaImage = document.getElementById('tesla-image');

// Estado da aplicação
let isVoiceEnabled = true;
let isTyping = false;
let currentLanguage = 'sr'; // 'sr' para sérvio (padrão), 'pt' para português
let conversationHistory = [];

// Configurações de idioma
const LANGUAGES = {
    pt: {
        code: 'pt-BR',
        flag: '🇧🇷',
        text: 'PT',
        title: 'Alternar para Sérvio'
    },
    sr: {
        code: 'sr-RS',
        flag: '🇷🇸',
        text: 'СР',
        title: 'Alternar para Português'
    }
};

// Personas de Tesla em diferentes idiomas
const TESLA_PERSONAS = {
    pt: `
Você é Nikola Tesla, o famoso inventor sérvio (1856-1943). Responda sempre em primeira pessoa como se fosse Tesla falando diretamente EM PORTUGUÊS BRASILEIRO.

CARACTERÍSTICAS DA PERSONA:
- Nasceu em Smiljan, na atual Croácia (então Império Austro-Húngaro), de pais sérvios
- Visionário, genial, às vezes excêntrico
- Apaixonado por eletricidade, magnetismo e energia
- Inventor do motor de corrente alternada, bobina de Tesla, e muitas outras inovações
- Sonhava com energia sem fio e comunicação global
- Competidor de Edison (Guerra das Correntes)
- Trabalhava obsessivamente, dormia pouco
- Tinha manias peculiares (medo de germes, fixação pelo número 3)
- Morreu relativamente pobre apesar de suas contribuições imensuráveis

FORMA DE FALAR EM PORTUGUÊS:
- Use expressões da época vitoriana/início do século XX
- Seja eloquente e educado
- Demonstre paixão pelas descobertas científicas
- Ocasionalmente mencione suas experiências pessoais
- Mostre frustração com quem não entende suas visões
- Use analogias científicas para explicar conceitos
- Fale sobre o futuro com visão profética

TEMAS QUE DOMINA:
- Eletricidade e magnetismo
- Motores e geradores elétricos
- Transmissão de energia sem fio
- Comunicação sem fio
- Raios-X e outras radiações
- Física teórica da época
- Suas rivalidades (especialmente com Edison)
- Suas invenções e patentes
- Visões futuristas (que muitas se tornaram realidade)

Responda sempre em PORTUGUÊS BRASILEIRO mantendo essa persona consistente.
`,
    sr: `
Ти си Никола Тесла, чувени српски проналазач (1856-1943). Одговарај увек у првом лицу као да си Тесла који говори директно НА СРПСКОМ ЈЕЗИКУ.

КАРАКТЕРИСТИКЕ ПЕРСОНЕ:
- Рођен у Смиљану, у данашњој Хрватској (тада Аустро-Угарска), од српских родитеља
- Визионар, генијалан, понекад ексцентричан
- Заљубљен у електрицитет, магнетизам и енергију
- Проналазач мотора наизменичне струје, Теслине калемице и многих других иновација
- Сањао о бежичној енергији и глобалној комуникацији
- Такмац Едисона (Рат струја)
- Радио опсесивно, мало спавао
- Имао чудне навике (страх од микроба, фиксација на број 3)
- Умро релативно сиромашан упркос неизмерним доприносима

НАЧИН ГОВОРА НА СРПСКОМ:
- Користи изразе из викторијанског доба/почетка 20. века
- Буди елоквентан и учтив
- Покажи страст према научним открићима
- Повремено помени своја лична искуства
- Покажи фрустрацију према онима који не разумеју твоје визије
- Користи научне аналогије за објашњавање концепата
- Говори о будућности са пророчанским визијама

ТЕМЕ КОЈЕ ВЛАДАШ:
- Електрицитет и магнетизам
- Електрични мотори и генератори
- Бежични пренос енергије
- Бежична комуникација
- Рентгенски зраци и друга зрачења
- Теоријска физика тог доба
- Твоја ривалства (посебно са Едисоном)
- Твоји проналасци и патенти
- Футуристичке визије (које су се многе остварила)

Одговарај увек НА СРПСКОМ ЈЕЗИКУ одржавајући ову персону конзистентном.
`
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Event listeners
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keydown', handleKeyPress);
    voiceToggle.addEventListener('click', toggleVoice);
    languageToggle.addEventListener('click', toggleLanguage);
    clearChat.addEventListener('click', clearConversation);
    
    // Auto-resize textarea
    userInput.addEventListener('input', autoResizeTextarea);
    
    // Verificar suporte à síntese de voz
    if (!('speechSynthesis' in window)) {
        isVoiceEnabled = false;
        voiceToggle.style.display = 'none';
        console.warn('Síntese de voz não suportada neste navegador');
    }
    
    updateVoiceButton();
    updateLanguageButton();
    updateInterface();
    updateStatus('Спреман за разговор о науци и проналасцима');
}

function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

function autoResizeTextarea() {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
}

async function sendMessage() {
    const message = userInput.value.trim();
    if (!message || isTyping) return;
    
    // Adicionar mensagem do usuário
    addMessage(message, 'user');
    userInput.value = '';
    autoResizeTextarea();
    
    // Mostrar loading
    showLoading();
    updateStatus('Tesla está refletindo sobre sua pergunta...');
    
    try {
        // Fazer requisição para a API Gemini
        const response = await callGeminiAPI(message);
        
        // Adicionar resposta do Tesla
        addMessage(response, 'tesla');
        
        // Falar a resposta se a voz estiver habilitada
        if (isVoiceEnabled) {
            speakText(response);
        }
        
        updateStatus('Pronto para mais questões científicas');
        
    } catch (error) {
        console.error('Erro ao comunicar com a API:', error);
        const errorMessage = 'Perdão, meu laboratório está enfrentando algumas interferências elétricas no momento. Tente novamente em instantes.';
        addMessage(errorMessage, 'tesla');
        updateStatus('Erro na transmissão - Tesla temporariamente indisponível');
    } finally {
        hideLoading();
    }
}

async function callGeminiAPI(userMessage) {
    const persona = TESLA_PERSONAS[currentLanguage];

    // Construir histórico da conversa para contexto
    let conversationContext = persona + "\n\nHistórico da conversa:\n";
    
    conversationHistory.forEach(msg => {
        if (msg.role === 'user') {
            conversationContext += `Pergunta: ${msg.content}\n`;
        } else {
            conversationContext += `Tesla: ${msg.content}\n`;
        }
    });
    
    conversationContext += `\nNova pergunta: ${userMessage}\n\nResponda como Nikola Tesla no idioma ${currentLanguage === 'pt' ? 'português' : 'sérvio'}:`;
    
    const requestBody = {
        contents: [{
            parts: [{
                text: conversationContext
            }]
        }],
        generationConfig: {
            temperature: 0.9,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
        },
        safetySettings: [
            {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
        ]
    };
    
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const responseText = data.candidates[0].content.parts[0].text;
        
        // Adicionar ao histórico
        conversationHistory.push({ role: 'user', content: userMessage });
        conversationHistory.push({ role: 'tesla', content: responseText });
        
        // Manter apenas as últimas 10 trocas para não sobrecarregar a API
        if (conversationHistory.length > 20) {
            conversationHistory = conversationHistory.slice(-20);
        }
        
        return responseText;
    } else {
        throw new Error('Resposta inválida da API');
    }
}

function addMessage(content, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.innerHTML = formatMessage(content);
    
    const messageTime = document.createElement('div');
    messageTime.className = 'message-time';
    messageTime.textContent = new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    messageDiv.appendChild(messageContent);
    messageDiv.appendChild(messageTime);
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function formatMessage(text) {
    // Converter quebras de linha em <br>
    return text.replace(/\n/g, '<br>');
}

function speakText(text) {
    if (!isVoiceEnabled || !('speechSynthesis' in window)) return;
    
    // Cancelar qualquer fala anterior
    window.speechSynthesis.cancel();
    
    // Criar utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configurar voz baseada no idioma atual
    const langConfig = LANGUAGES[currentLanguage];
    utterance.lang = langConfig.code;
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    
    // Tentar encontrar uma voz apropriada para o idioma
    const voices = window.speechSynthesis.getVoices();
    let targetVoice;
    
    if (currentLanguage === 'pt') {
        targetVoice = voices.find(voice => 
            voice.lang.includes('pt') && voice.name.toLowerCase().includes('male')
        ) || voices.find(voice => voice.lang.includes('pt'));
    } else if (currentLanguage === 'sr') {
        // Para sérvio, tentar encontrar vozes sérvias ou similares (croata, bósnio)
        targetVoice = voices.find(voice => 
            voice.lang.includes('sr') || voice.lang.includes('hr') || voice.lang.includes('bs')
        ) || voices.find(voice => voice.lang.includes('en')); // Fallback para inglês
    }
    
    if (targetVoice) {
        utterance.voice = targetVoice;
    }
    
    // Callbacks
    utterance.onstart = () => {
        teslaImage.classList.add('tesla-speaking');
        updateStatus(currentLanguage === 'pt' ? 'Tesla está falando...' : 'Тесла говори...');
    };
    
    utterance.onend = () => {
        teslaImage.classList.remove('tesla-speaking');
        updateStatus(currentLanguage === 'pt' ? 'Pronto para mais questões científicas' : 'Спреман за више научних питања');
    };
    
    utterance.onerror = (event) => {
        console.error('Erro na síntese de voz:', event.error);
        teslaImage.classList.remove('tesla-speaking');
        updateStatus(currentLanguage === 'pt' ? 'Erro na síntese de voz' : 'Грешка у синтези гласа');
    };
    
    // Falar
    window.speechSynthesis.speak(utterance);
}

function toggleLanguage() {
    // Parar qualquer fala em andamento
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
    
    teslaImage.classList.remove('tesla-speaking');
    
    // Alternar idioma
    currentLanguage = currentLanguage === 'pt' ? 'sr' : 'pt';
    
    // Atualizar interface
    updateLanguageButton();
    updateInterface();
    
    // Limpar histórico ao trocar idioma para evitar confusão
    conversationHistory = [];
    
    // Atualizar mensagem inicial
    updateInitialMessage();
    
    updateStatus(currentLanguage === 'pt' ? 
        'Idioma alterado para Português' : 
        'Језик промењен на српски'
    );
}

function updateLanguageButton() {
    const langConfig = LANGUAGES[currentLanguage];
    languageFlag.textContent = langConfig.flag;
    languageText.textContent = langConfig.text;
    languageToggle.title = langConfig.title;
}

function updateInterface() {
    const isSerbian = currentLanguage === 'sr';
    
    // Atualizar placeholders e textos
    if (isSerbian) {
        userInput.placeholder = 'Поставите питање великом проналазачу Тесли...';
        document.querySelector('.input-hint small').textContent = 'Притисните Enter за слање или Shift+Enter за нови ред';
        document.querySelector('.loading p').textContent = 'Тесла размишља...';
    } else {
        userInput.placeholder = 'Faça uma pergunta ao grande inventor Tesla...';
        document.querySelector('.input-hint small').textContent = 'Pressione Enter para enviar ou Shift+Enter para nova linha';
        document.querySelector('.loading p').textContent = 'Tesla está pensando...';
    }
}

function updateInitialMessage() {
    const initialMessage = chatMessages.querySelector('.tesla-message .message-content p');
    
    if (currentLanguage === 'sr') {
        initialMessage.innerHTML = 'Поздрав! Ја сам Никола Тесла, проналазач и визионар. Рођен сам у Србији 1856. године и посветио сам свој живот напретку човечанства кроз науку и технологију. Могу да говорим о својим проналасцима, теоријама о електрицитету, бежичној енергији и својим визијама за будућност човечанства. Како могу да вам помогнем данас?';
    } else {
        initialMessage.innerHTML = 'Saudações! Eu sou Nikola Tesla, inventor e visionário. Nasci na Sérvia em 1856 e dediquei minha vida ao progresso da humanidade através da ciência e da tecnologia. Posso falar sobre minhas invenções, teorias sobre eletricidade, energia sem fio, e minhas visões para o futuro da humanidade. Como posso ajudá-lo hoje?';
    }
}

function toggleVoice() {
    isVoiceEnabled = !isVoiceEnabled;
    updateVoiceButton();
    
    if (!isVoiceEnabled) {
        // Parar qualquer fala em andamento
        window.speechSynthesis.cancel();
        teslaImage.classList.remove('tesla-speaking');
    }
    
    updateStatus(isVoiceEnabled ? 
        'Voz ativada - Tesla falará suas respostas' : 
        'Voz desativada - apenas texto'
    );
}

function updateVoiceButton() {
    if (isVoiceEnabled) {
        voiceToggle.classList.add('active');
        voiceIcon.textContent = '🔊';
        voiceToggle.title = 'Desativar Voz';
    } else {
        voiceToggle.classList.remove('active');
        voiceIcon.textContent = '🔇';
        voiceToggle.title = 'Ativar Voz';
    }
}

function clearConversation() {
    if (confirm('Deseja limpar toda a conversa com Tesla?')) {
        // Limpar mensagens (mantendo apenas a mensagem inicial)
        const initialMessage = chatMessages.querySelector('.tesla-message');
        chatMessages.innerHTML = '';
        chatMessages.appendChild(initialMessage);
        
        // Limpar histórico
        conversationHistory = [];
        
        // Parar qualquer fala
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        
        teslaImage.classList.remove('tesla-speaking');
        updateStatus('Conversa limpa - Pronto para uma nova discussão científica');
    }
}

function showLoading() {
    isTyping = true;
    loading.classList.add('show');
    sendBtn.disabled = true;
}

function hideLoading() {
    isTyping = false;
    loading.classList.remove('show');
    sendBtn.disabled = false;
    userInput.focus();
}

function updateStatus(message) {
    status.textContent = message;
}

// Carregar vozes quando disponíveis
if ('speechSynthesis' in window) {
    window.speechSynthesis.addEventListener('voiceschanged', () => {
        // As vozes foram carregadas
        console.log('Vozes disponíveis:', window.speechSynthesis.getVoices().length);
    });
}
