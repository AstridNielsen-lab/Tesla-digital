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
    showSplashScreen();
});

// Função para controlar a splashscreen
function showSplashScreen() {
    const splashscreen = document.getElementById('splashscreen');
    const mainContent = document.getElementById('main-content');
    
    // Inicialmente esconder o conteúdo principal
    mainContent.style.display = 'none';
    
    // Após 3 segundos, esconder splashscreen e mostrar conteúdo
    setTimeout(() => {
        splashscreen.classList.add('hidden');
        
        // Aguardar animação de fade out da splashscreen
        setTimeout(() => {
            splashscreen.style.display = 'none';
            mainContent.style.display = 'flex';
            mainContent.classList.add('show');
            
            // Inicializar a aplicação após mostrar o conteúdo
            initializeApp();
        }, 500);
    }, 3000);
}

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
    } else {
        // Aguardar carregamento das vozes e diagnosticar
        setTimeout(() => {
            diagnoseVoices();
        }, 1000);
    }
    
    updateVoiceButton();
    updateLanguageButton();
    updateInterface();
    updateStatus('Спреман за разговор о науци и проналасцима');
}

// Função para diagnosticar vozes disponíveis
function diagnoseVoices() {
    const voices = window.speechSynthesis.getVoices();
    console.log('=== DIAGNÓSTICO DE VOZES ===');
    console.log('Total de vozes:', voices.length);
    
    // Agrupar por idioma
    const voicesByLang = {};
    voices.forEach(voice => {
        const lang = voice.lang.toLowerCase();
        if (!voicesByLang[lang]) {
            voicesByLang[lang] = [];
        }
        voicesByLang[lang].push(voice.name);
    });
    
    console.log('Vozes por idioma:', voicesByLang);
    
    // Verificar especificamente para sérvio e idiomas eslavos
    const slavicLanguages = ['sr', 'hr', 'bs', 'mk', 'bg', 'sl', 'ru', 'cs', 'sk', 'pl'];
    const foundSlavic = slavicLanguages.filter(lang => 
        voices.some(voice => voice.lang.toLowerCase().includes(lang))
    );
    
    console.log('Idiomas eslavos encontrados:', foundSlavic);
    
    if (foundSlavic.length === 0) {
        console.warn('⚠️ Nenhuma voz eslava encontrada. Tesla usará fallback para inglês.');
    } else {
        console.log('✅ Vozes eslavas disponíveis para Tesla!');
    }
    
    // Testar síntese de voz com uma frase curta
    testVoiceSynthesis();
}

// Função para testar síntese de voz
function testVoiceSynthesis() {
    console.log('Testando síntese de voz...');
    
    const testText = currentLanguage === 'sr' ? 'Тест' : 'Teste';
    const utterance = new SpeechSynthesisUtterance(testText);
    utterance.volume = 0.1; // Volume baixo para não incomodar
    utterance.rate = 2; // Rápido para não demorar
    
    utterance.onstart = () => {
        console.log('✅ Síntese de voz funcionando!');
    };
    
    utterance.onerror = (event) => {
        console.error('❌ Erro na síntese de voz:', event.error);
    };
    
    // Executar teste silencioso
    window.speechSynthesis.speak(utterance);
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
    
    // Aguardar um pouco para garantir que o cancelamento foi processado
    setTimeout(() => {
        // Criar utterance
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Configurar voz baseada no idioma atual
        const langConfig = LANGUAGES[currentLanguage];
        utterance.rate = 0.85;
        utterance.pitch = 1.0;
        utterance.volume = 0.9;
        
        // Aguardar vozes serem carregadas se necessário
        const setupVoice = () => {
            const voices = window.speechSynthesis.getVoices();
            console.log('Vozes disponíveis:', voices.map(v => `${v.name} (${v.lang})`));
            
            let targetVoice = null;
            
            if (currentLanguage === 'pt') {
                // Tentar encontrar vozes em português
                targetVoice = voices.find(voice => 
                    voice.lang.toLowerCase().includes('pt') && voice.name.toLowerCase().includes('male')
                ) || voices.find(voice => 
                    voice.lang.toLowerCase().includes('pt-br')
                ) || voices.find(voice => 
                    voice.lang.toLowerCase().includes('pt')
                );
                
                utterance.lang = 'pt-BR';
                console.log('Tentando usar voz em português:', targetVoice?.name);
                
            } else if (currentLanguage === 'sr') {
                // Para sérvio, tentar múltiplas estratégias
                targetVoice = 
                    // 1. Sérvio direto
                    voices.find(voice => voice.lang.toLowerCase().includes('sr')) ||
                    // 2. Sérvio com variações
                    voices.find(voice => voice.lang.toLowerCase().includes('sr-rs')) ||
                    voices.find(voice => voice.lang.toLowerCase().includes('sr-latn')) ||
                    voices.find(voice => voice.lang.toLowerCase().includes('sr-cyrl')) ||
                    // 3. Idiomas eslavos próximos
                    voices.find(voice => voice.lang.toLowerCase().includes('hr')) || // Croata
                    voices.find(voice => voice.lang.toLowerCase().includes('bs')) || // Bósnio
                    voices.find(voice => voice.lang.toLowerCase().includes('mk')) || // Macedônio
                    voices.find(voice => voice.lang.toLowerCase().includes('bg')) || // Búlgaro
                    voices.find(voice => voice.lang.toLowerCase().includes('sl')) || // Esloveno
                    // 4. Russo como backup eslavo
                    voices.find(voice => voice.lang.toLowerCase().includes('ru')) ||
                    // 5. Fallback para inglês
                    voices.find(voice => voice.lang.toLowerCase().includes('en'));
                
                // Configurar idioma
                if (targetVoice) {
                    if (targetVoice.lang.toLowerCase().includes('sr')) {
                        utterance.lang = 'sr-RS';
                    } else if (targetVoice.lang.toLowerCase().includes('hr')) {
                        utterance.lang = 'hr-HR';
                    } else if (targetVoice.lang.toLowerCase().includes('ru')) {
                        utterance.lang = 'ru-RU';
                    } else {
                        utterance.lang = targetVoice.lang;
                    }
                } else {
                    utterance.lang = 'sr-RS'; // Padrão sérvio
                }
                
                console.log('Tentando usar voz para sérvio:', targetVoice?.name, '- Idioma configurado:', utterance.lang);
            }
            
            if (targetVoice) {
                utterance.voice = targetVoice;
                console.log('Voz selecionada:', targetVoice.name, '(' + targetVoice.lang + ')');
            } else {
                console.warn('Nenhuma voz adequada encontrada para', currentLanguage);
            }
            
            return targetVoice;
        };
        
        // Configurar voz
        setupVoice();
        
        // Callbacks
        utterance.onstart = () => {
            teslaImage.classList.add('tesla-speaking');
            updateStatus(currentLanguage === 'pt' ? 'Tesla está falando...' : 'Тесла говори...');
            console.log('Síntese de voz iniciada');
        };
        
        utterance.onend = () => {
            teslaImage.classList.remove('tesla-speaking');
            updateStatus(currentLanguage === 'pt' ? 'Pronto para mais questões científicas' : 'Спреман за више научних питања');
            console.log('Síntese de voz finalizada');
        };
        
        utterance.onerror = (event) => {
            console.error('Erro na síntese de voz:', event.error, event);
            teslaImage.classList.remove('tesla-speaking');
            updateStatus(currentLanguage === 'pt' ? 'Erro na síntese de voz' : 'Грешка у синтези гласа');
            
            // Tentar novamente com uma voz diferente se disponível
            if (event.error === 'voice-unavailable' || event.error === 'language-unavailable') {
                console.log('Tentando com voz padrão do sistema...');
                const fallbackUtterance = new SpeechSynthesisUtterance(text);
                fallbackUtterance.rate = 0.85;
                fallbackUtterance.pitch = 1.0;
                fallbackUtterance.volume = 0.9;
                // Não definir voz específica, usar padrão do sistema
                window.speechSynthesis.speak(fallbackUtterance);
            }
        };
        
        // Falar
        console.log('Iniciando síntese de voz...');
        window.speechSynthesis.speak(utterance);
        
    }, 100); // Pequeno delay para garantir que o cancel foi processado
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
