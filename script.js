// Seleciona os elementos da função de instruções
const helpLink = document.getElementById('helpLink');
const instructionOverlay = document.getElementById('instructionOverlay');
const closeBtn = document.getElementById('closeInstructionBtn');

// Abre a caixa de intruções
helpLink.addEventListener('click', e => {
  e.preventDefault();
  instructionOverlay.style.display = 'block';
});

// Fecha a caixa de intruções
closeBtn.addEventListener('click', () => {
  instructionOverlay.style.display = 'none';
});

// Seleciona os botões da interface
const btnAdd = document.getElementById('addStateBtn');
const btnRemove = document.getElementById('removeStateBtn');
const btnInitial = document.getElementById('markInitialBtn');
const btnFinal = document.getElementById('markFinalBtn');
const btnConfigureTransition = document.getElementById('configureTransitionBtn');

// Associa funções aos cliques dos botões
btnAdd.onclick = addState;
btnRemove.onclick = removeState;
btnInitial.onclick = toggleInitial;
btnFinal.onclick = toggleFinal;
btnConfigureTransition.onclick = configureTransition;

// Seleciona o container onde os estados serão adicionados
const container = document.getElementById('container');
// Contador de estados criados
let stateCount = 0;
// Tamanho do estado e espaçamentos entre eles
const stateSize = 50, hSpacing = 40, vSpacing = 40, margin = 20;
// Próximas posições onde um novo estado será colocado
let nextX = margin, nextY = margin;
// Estado atualmente selecionado
let selectedState = null;
// Estado inicial (se houver)
let initialState = null;
// Objeto que armazena todas as transições do AFD
const transitions = {};

// Função responsável por adicionar um novo estado ao autômato
function addState() {
    // Verifica se já foram criados 10 estados; se sim, exibe alerta e interrompe a função
    if (stateCount >= 10) return alert('Máximo de 10 estados atingido.');

    // Se o próximo estado não couber horizontalmente dentro do container,
    // reinicia a coordenada X e move para a próxima linha (direção vertical)
    if (nextX + stateSize + margin > container.clientWidth) {
        nextX = margin; // volta ao início da linha
        nextY += stateSize + vSpacing; // desce para a próxima linha
    }

    // Se não houver mais espaço vertical no container, exibe alerta e cancela a adição
    if (nextY + stateSize + margin > container.clientHeight) {
        return alert('Não cabe mais estados verticalmente.');
    }

    // Gera um nome único para o novo estado (ex: q0, q1, q2...)
    const name = `q${stateCount++}`;

    // Cria o elemento visual (div) representando o estado
    const el = document.createElement('div');
    el.className = 'state'; // adiciona classe CSS para estilo
    el.innerText = name; // define o texto interno com o nome do estado

    // Posiciona o estado no container com base nas coordenadas atuais
    el.style.left = `${nextX}px`;
    el.style.top = `${nextY}px`;

    // Adiciona o estado visual ao container na tela
    container.appendChild(el);

    // Cria e inicializa a estrutura de dados para as transições a partir desse estado
    transitions[name] = {};

    // Atualiza a coordenada horizontal para o próximo estado
    nextX += stateSize + hSpacing;

    // Permite que o estado seja clicável e arrastável (função definida em outro lugar)
    makeSelectableAndDraggable(el);
}

// Função para remover o estado atualmente selecionado
function removeState() {
    // Se nenhum estado estiver selecionado, exibe um alerta e cancela a ação
    if (!selectedState) return alert('Nenhum estado selecionado.');

    // Se o estado selecionado for o estado inicial, remove seu marcador visual
    if (selectedState === initialState) removeInitialMarker();

    // Obtém o nome do estado a ser removido (ex: "q0", "q1", etc.)
    const stateName = selectedState.innerText;

    // Remove visualmente todas as conexões (linhas e laços) ligadas ao estado
    document.querySelectorAll('.connection-line, .loop-container').forEach(conn => {
        // Se a conexão parte de ou vai para o estado sendo removido
        if (conn.dataset.from === stateName || conn.dataset.to === stateName) {
            container.removeChild(conn); // remove do container
        }
    });

    // Remove todos os rótulos (labels) relacionados às transições do estado
    document.querySelectorAll('.transition-label, .self-loop-label').forEach(label => {
        // Se o rótulo estiver associado ao estado que será removido
        if (label.dataset.from === stateName || label.dataset.to === stateName) {
            // Verifica se o label ainda está presente na árvore DOM
            if (label.parentNode) {
                label.parentNode.removeChild(label); // remove o rótulo visual
            }
        }
    });

    // Remove o elemento visual do estado do container
    container.removeChild(selectedState);

    // Remove o estado da estrutura de transições (dados)
    delete transitions[stateName];

    // Limpa a seleção atual de estado
    selectedState = null;

    // Remove referências a esse estado nas transições de todos os outros estados
    Object.keys(transitions).forEach(key => {
        Object.keys(transitions[key]).forEach(symbol => {
            // Se alguma transição aponta para o estado removido
            if (transitions[key][symbol] === stateName) {
                delete transitions[key][symbol]; // remove essa transição
            }
        });
    });
}

// Função para alternar o estado inicial (define ou remove)
function toggleInitial() {
    // Se nenhum estado estiver selecionado, exibe um alerta e cancela a ação
    if (!selectedState) return alert('Selecione um estado para marcar como inicial.');

    // Se o estado selecionado já é o estado inicial atual
    if (initialState === selectedState) {
        // Remove a marcação de estado inicial
        removeInitialMarker();
    } else {
        // Se já houver um estado inicial, remove sua marcação
        if (initialState) removeInitialMarker();

        // Define o estado selecionado como o novo estado inicial
        initialState = selectedState;

        // Adiciona a classe CSS que indica visualmente que este é o estado inicial
        initialState.classList.add('initial');

        // Desenha a seta que aponta para o estado inicial
        drawInitialArrow(initialState);
    }
}

// Função para alternar a marcação de estado final (define ou remove)
function toggleFinal() {
    // Se nenhum estado estiver selecionado, exibe um alerta e cancela a ação
    if (!selectedState) return alert('Selecione um estado para marcar como final.');

    // Verifica se o estado já está marcado como final
    if (selectedState.classList.contains('final')) {
        // Remove a classe CSS que indica visualmente o estado final
        selectedState.classList.remove('final');

        // Busca o elemento visual que representa o círculo interno (estado final)
        const ic = selectedState.querySelector('.inner-circle');

        // Se o círculo interno existir, remove ele do DOM
        if (ic) selectedState.removeChild(ic);
    } else {
        // Marca o estado como final adicionando a classe CSS
        selectedState.classList.add('final');

        // Cria o círculo interno que será usado para representar visualmente o estado final
        const ic = document.createElement('div');
        ic.className = 'inner-circle';

        // Adiciona o círculo ao estado selecionado
        selectedState.appendChild(ic);
    }
}

// Função que torna um estado selecionável com clique e arrastável com o mouse
function makeSelectableAndDraggable(el) {
    let isDragging = false; // Indica se o estado está sendo arrastado
    let startX, startY;     // Posições iniciais do mouse
    let dragTimer;          // Timer para diferenciar clique de arraste

    // Evento disparado ao pressionar o botão do mouse sobre o elemento
    el.addEventListener('mousedown', (e) => {
        // Ignora se o clique não for diretamente no elemento
        if (e.target !== el) return;

        e.preventDefault();     // Evita comportamento padrão do navegador
        isDragging = false;     // Inicializa como não arrastando
        startX = e.clientX;     // Salva posição inicial X do mouse
        startY = e.clientY;     // Salva posição inicial Y do mouse

        // Inicia um temporizador — após 100ms, consideramos que é um arraste
        dragTimer = setTimeout(() => {
            isDragging = true;
        }, 100);

        // Função executada enquanto o mouse se move
        function onMouseMove(e) {
            if (!isDragging) return;

            // Calcula o deslocamento do mouse
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            // Só continua se o movimento for significativo
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                clearTimeout(dragTimer); // Cancela o temporizador

                // Calcula nova posição do estado
                const newX = el.offsetLeft + dx;
                const newY = el.offsetTop + dy;

                // Garante que o estado fique dentro dos limites do container
                const boundedX = Math.max(0, Math.min(newX, container.clientWidth - stateSize));
                const boundedY = Math.max(0, Math.min(newY, container.clientHeight - stateSize));

                // Aplica as novas coordenadas ao estilo
                el.style.left = `${boundedX}px`;
                el.style.top = `${boundedY}px`;

                // Atualiza as posições iniciais para o próximo movimento
                startX = e.clientX;
                startY = e.clientY;

                // Atualiza as conexões visuais (linhas e setas) ligadas ao estado
                updateConnections(el);
            }
        }

        // Função executada ao soltar o botão do mouse
        function onMouseUp(e) {
            // Se não estiver arrastando, então foi um clique — seleciona o estado
            if (!isDragging) {
                selectState(el);
            }

            // Remove os listeners de movimento e soltura
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            clearTimeout(dragTimer); // Cancela o temporizador, se ainda ativo
        }

        // Adiciona os eventos para acompanhar movimento e soltar o mouse
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}

// Função que seleciona ou desseleciona um estado (elemento visual)
function selectState(el) {
    // Se já houver um estado selecionado, remove a borda colorida dele
    if (selectedState) {
        selectedState.style.borderColor = '';
    }

    // Se o estado clicado for diferente do que já estava selecionado
    if (selectedState !== el) {
        // Aplica uma borda vermelha para indicar visualmente a seleção
        el.style.borderColor = 'red';
        // Define o novo estado como o atualmente selecionado
        selectedState = el;
    } else {
        // Se clicar novamente no mesmo estado, ele é desselecionado
        selectedState = null;
    }
}

// Função que desenha a seta indicadora de estado inicial em um estado (el)
function drawInitialArrow(el) {
    // Cria um novo elemento <div> que conterá a seta
    const arrow = document.createElement('div');

    // Define a classe CSS da seta (para posicionamento/estilo)
    arrow.className = 'initial-arrow';

    // Define o conteúdo SVG da seta: uma linha e um polígono (cabeça da seta)
    arrow.innerHTML = `
        <svg width="40" height="12">
            <!-- Linha horizontal da seta -->
            <line x1="0" y1="6" x2="30" y2="6" stroke="#000" stroke-width="2"/>
            <!-- Cabeça triangular da seta -->
            <polygon points="30,1 30,11 40,6" fill="#000"/>
        </svg>
    `;

    // Adiciona o elemento da seta ao estado especificado
    el.appendChild(arrow);
}

// Função que remove a marcação de estado inicial
function removeInitialMarker() {
    // Se nenhum estado estiver marcado como inicial, não faz nada
    if (!initialState) return;

    // Procura o elemento visual da seta de inicial dentro do estado
    const arrow = initialState.querySelector('.initial-arrow');

    // Se a seta existir, remove ela do DOM
    if (arrow) initialState.removeChild(arrow);

    // Remove a classe CSS que marca o estado como inicial
    initialState.classList.remove('initial');

    // Limpa a referência ao estado inicial
    initialState = null;
}

function configureTransition() {
    // Verifica se um estado de origem foi selecionado
    if (!selectedState) return alert('Selecione um estado de origem.');
    
    // Solicita ao usuário o símbolo da transição (0 ou 1)
    const symbol = prompt(`Digite o símbolo de leitura (0 ou 1):`);
    
    // Valida o símbolo: apenas '0' ou '1' são aceitos
    if (symbol !== '0' && symbol !== '1') return alert('Símbolo inválido. Use apenas 0 ou 1.');
    
    // Verifica se já existe uma transição com esse símbolo a partir do estado atual
    if (transitions[selectedState.innerText][symbol]) {
      // Se existir, pede confirmação para substituir
      if (!confirm(`Já existe uma transição para ${symbol}. Deseja substituir?`)) {
        return;
      }
  
      // Se o usuário confirmar, remove a transição existente
      const existingTarget = transitions[selectedState.innerText][symbol];
      const targetEl = Array.from(container.children).find(c => 
        c.classList.contains('state') && c.innerText === existingTarget
      );
      if (targetEl) {
        removeExistingConnection(selectedState, targetEl, symbol);
      }
    }
  
    // Solicita o nome do estado destino
    const targetName = prompt('Digite o nome do estado destino (ex: q0):');
  
    // Procura o elemento visual correspondente ao nome informado
    const targetEl = Array.from(container.children).find(c => 
      c.classList.contains('state') && c.innerText === targetName
    );
  
    // Se o estado não for encontrado, avisa o usuário
    if (!targetEl) return alert('Estado destino não encontrado.');
  
    // Registra a nova transição na estrutura de dados
    transitions[selectedState.innerText][symbol] = targetName;
  
    // Desenha visualmente a conexão entre os estados
    drawConnection(selectedState, targetEl, symbol);
}

function drawConnection(fromEl, toEl, symbol) {
    // Remove qualquer conexão existente entre os estados
    removeExistingConnection(fromEl, toEl, symbol);

    // Se a conexão for entre o mesmo estado (auto laço)
    if (fromEl === toEl) {
        drawSelfLoop(fromEl, symbol);
        return;
    }

    // Criação do elemento visual para a linha da conexão
    const line = document.createElement('div');
    line.className = 'connection-line';

    // Criação do rótulo (símbolo de transição) para a conexão
    const label = document.createElement('div');
    label.className = 'transition-label';
    label.textContent = symbol;

    // Calcula as coordenadas centrais dos estados de origem e destino
    const fromX = fromEl.offsetLeft + stateSize / 2;
    const fromY = fromEl.offsetTop + stateSize / 2;
    const toX = toEl.offsetLeft + stateSize / 2;
    const toY = toEl.offsetTop + stateSize / 2;

    // Calcula as diferenças de posição entre os estados (delta X e Y)
    const dx = toX - fromX;
    const dy = toY - fromY;

    // Calcula o ângulo da linha entre os estados
    const angle = Math.atan2(dy, dx);

    // Calcula a distância entre os dois estados
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Definição do raio do estado (metade do tamanho)
    const radius = stateSize / 2;

    // Calcula as coordenadas de início e fim da linha, levando em conta o raio dos estados
    const startX = fromX + radius * Math.cos(angle);
    const startY = fromY + radius * Math.sin(angle);
    const endX = toX - radius * Math.cos(angle);
    const endY = toY - radius * Math.sin(angle);

    // Ajusta a distância da linha para levar em conta a curvatura
    const adjustedDx = endX - startX;
    const adjustedDy = endY - startY;
    const adjustedDistance = Math.sqrt(adjustedDx * adjustedDx + adjustedDy * adjustedDy);

    // Verifica se já existe uma transição oposta (bidirecional) para não desenhar sobre ela
    const reverseLine = document.querySelector(
        `.connection-line[data-from="${toEl.innerText}"][data-to="${fromEl.innerText}"]`
    );

    // Define o deslocamento para transições bidirecionais (se houver)
    const offsetAmount = 10; // Pixels de deslocamento
    let offsetX = 0, offsetY = 0;

    if (reverseLine) {
        // Desloca perpendicularmente à linha original (normal ao vetor)
        const normalAngle = angle + Math.PI / 2;
        offsetX = offsetAmount * Math.cos(normalAngle);
        offsetY = offsetAmount * Math.sin(normalAngle);
    }

    // Define a posição da linha de conexão, considerando o deslocamento
    line.style.width = `${adjustedDistance}px`;
    line.style.left = `${startX + offsetX}px`;
    line.style.top = `${startY + offsetY}px`;
    line.style.transform = `rotate(${angle}rad)`;
    line.dataset.from = fromEl.innerText;
    line.dataset.to = toEl.innerText;
    line.dataset.symbol = symbol;

    // Define a posição do rótulo (símbolo), também com deslocamento
    const labelX = startX + adjustedDx * 0.5 + offsetX - 10;
    const labelY = startY + adjustedDy * 0.5 + offsetY - 8;
    label.style.left = `${labelX}px`;
    label.style.top = `${labelY}px`;
    label.dataset.from = fromEl.innerText;
    label.dataset.to = toEl.innerText;
    label.dataset.symbol = symbol;

    // Adiciona a linha e o rótulo no container visual
    container.appendChild(line);
    container.appendChild(label);
}

function drawSelfLoop(stateEl, symbol) {
    // Remove qualquer loop existente com o mesmo símbolo
    removeExistingConnection(stateEl, stateEl, symbol);

    // Conta quantos loops já existem neste estado
    const existingLoops = document.querySelectorAll(
        `.loop-container[data-from="${stateEl.innerText}"][data-to="${stateEl.innerText}"]`
    );
    const isSecondLoop = existingLoops.length >= 1;

    // Cria o container visual para o loop
    const loopContainer = document.createElement('div');
    loopContainer.className = 'loop-container';
    loopContainer.style.position = 'absolute';
    loopContainer.style.left = `${stateEl.offsetLeft}px`;
    loopContainer.style.width = `${stateSize}px`;
    loopContainer.style.height = `60px`;
    loopContainer.style.pointerEvents = 'none';

    // Posicionamento do loop (acima ou abaixo do estado)
    if (isSecondLoop) {
        loopContainer.style.top = `${stateEl.offsetTop + stateSize - 0}px`; // abaixo do estado
    } else {
        loopContainer.style.top = `${stateEl.offsetTop - 35}px`; // acima do estado
    }

    // Cria a imagem SVG do loop
    const loopImage = document.createElement('img');
    loopImage.src = 'imgs/loop.svg'; // Caminho para a imagem do loop
    loopImage.alt = 'Loop';
    loopImage.style.width = '40px';
    loopImage.style.height = '40px';
    loopImage.style.display = 'block';
    loopImage.style.margin = '0 auto'; // centraliza

    // Se for o segundo loop, inverte a imagem verticalmente
    if (isSecondLoop) {
        loopImage.style.transform = 'scaleY(-1)';
    }

    // Cria o rótulo com o símbolo do loop
    const label = document.createElement('div');
    label.className = 'self-loop-label';
    label.textContent = symbol;
    label.style.position = 'absolute';

    // Posiciona o rótulo de acordo com o loop
    if (isSecondLoop) {
        label.style.top = '50px'; // abaixo da imagem
        label.style.left = '50%';
        label.style.transform = 'translateX(-50%)';
    } else {
        label.style.top = '-20px'; // acima da imagem
        label.style.right = '20px';
    }

    // Define os atributos de identificação
    loopContainer.dataset.from = stateEl.innerText;
    loopContainer.dataset.to = stateEl.innerText;
    loopContainer.dataset.symbol = symbol;

    // Adiciona a imagem e o rótulo ao container
    loopContainer.appendChild(loopImage);
    loopContainer.appendChild(label);

    // Adiciona o loop ao DOM
    container.appendChild(loopContainer);

    // Armazena referência ao loop no estado
    if (!stateEl.loopContainers) stateEl.loopContainers = [];
    stateEl.loopContainers.push(loopContainer);
}

function updateLoopPosition(stateEl, loopContainer) {
    // Atualiza a posição horizontal do loop
    loopContainer.style.left = `${stateEl.offsetLeft}px`;

    // Verifica se é um loop invertido (ou seja, está abaixo do estado)
    const isInverted = loopContainer.querySelector('img')?.style.transform === 'scaleY(-1)';

    // Atualiza a posição vertical do loop de acordo
    if (isInverted) {
        loopContainer.style.top = `${stateEl.offsetTop + stateSize - 0}px`; // abaixo do estado
    } else {
        loopContainer.style.top = `${stateEl.offsetTop - 35}px`; // acima do estado
    }
}

function removeExistingConnection(fromEl, toEl, symbol) {
    // Remove conexões normais (linhas entre dois estados diferentes)
    document.querySelectorAll('.connection-line').forEach(conn => {
        // Verifica se a linha corresponde à origem, destino e símbolo da transição
        if (conn.dataset.from === fromEl.innerText && 
            conn.dataset.to === toEl.innerText && 
            conn.dataset.symbol === symbol) {
            // Remove a linha do DOM
            container.removeChild(conn);
        }
    });
    
    // Caso seja uma auto-transição (loop do próprio estado para ele mesmo)
    if (fromEl === toEl) {
        document.querySelectorAll('.loop-container').forEach(container => {
            // Verifica se o loop corresponde à origem, destino e símbolo
            if (container.dataset.from === fromEl.innerText && 
                container.dataset.to === toEl.innerText && 
                container.dataset.symbol === symbol) {
                // Remove o container do loop, se estiver presente no DOM
                if (container.parentNode) {
                    container.parentNode.removeChild(container);
                }
            }
        });
    }
    
    // Remove rótulos (labels) tanto de transições normais quanto de auto-loops
    document.querySelectorAll('.transition-label, .self-loop-label').forEach(label => {
        // Verifica se o label pertence à transição com o símbolo e origem/destino correspondentes
        if (label.textContent === symbol && 
            label.dataset.from === fromEl.innerText && 
            label.dataset.to === toEl.innerText) {
            // Remove o label do DOM
            if (label.parentNode) {
                label.parentNode.removeChild(label);
            }
        }
    });
}

function updateConnections(stateEl) {
    const stateName = stateEl.innerText; // Pega o nome do estado (ex: "q0")

    // === Atualiza todas as conexões normais que envolvem este estado ===
    document.querySelectorAll('.connection-line').forEach(conn => {
        // Verifica se o estado atual é origem ou destino da linha
        if (conn.dataset.from === stateName || conn.dataset.to === stateName) {

            // Encontra os elementos DOM dos estados de origem e destino
            const fromEl = Array.from(container.children).find(c => 
                c.classList.contains('state') && c.innerText === conn.dataset.from);
            const toEl = Array.from(container.children).find(c => 
                c.classList.contains('state') && c.innerText === conn.dataset.to);
            
            // Se ambos os estados existem...
            if (fromEl && toEl) {
                const symbol = conn.dataset.symbol; // Pega o símbolo da transição
                container.removeChild(conn);         // Remove a linha antiga

                // Remove o label associado a essa linha
                const labels = document.querySelectorAll('.transition-label');
                labels.forEach(label => {
                    if (label.dataset.from === conn.dataset.from && 
                        label.dataset.to === conn.dataset.to && 
                        label.dataset.symbol === symbol) {
                        if (label.parentNode) {
                            label.parentNode.removeChild(label);
                        }
                    }
                });

                // Redesenha a conexão com base na nova posição dos estados
                drawConnection(fromEl, toEl, symbol);
            }
        }
    });

    // === Atualiza a posição de auto-loops (transições para o próprio estado) ===
    document.querySelectorAll('.loop-container').forEach(container => {
        // Verifica se a transição é para o mesmo estado
        if (container.dataset.from === stateName && container.dataset.to === stateName) {
            // Atualiza a posição do loop para acompanhar o estado arrastado
            updateLoopPosition(stateEl, container);
        }
    });
}

// Configura o botão de limpar a tela
document.getElementById('clearBtn').addEventListener('click', (e) => {
  e.preventDefault();
  location.reload();
});

// Seleciona o botão de teste e adiciona um ouvinte de evento de clique
document.getElementById("testBtn").addEventListener("click", function (e) {
  e.preventDefault();
  testSequence();
  });

/**
 * Função para testar a sequência inserida pelo usuário no AFD criado,
 * e destacar o caminho percorrido no autômato.
 */
async function testSequence() {
    const resultEl = document.getElementById('testResult');
    
    // Limpa a mensagem de resultado anterior
    resultEl.textContent = '';
    resultEl.style.display = 'block'; // <-- Faz aparecer

    const sequence = document.getElementById('inputSequence').value.trim();
  
    // Verifica se a sequência está vazia
    if (sequence === '') {
      resultEl.textContent = 'Por favor, insira uma sequência.';
      resultEl.style.color = 'red';
      return;
    }
  
    // Verifica se o estado inicial foi definido
    if (!initialState) {
      resultEl.textContent = 'Estado inicial não definido.';
      resultEl.style.color = 'red';
      return;
    }
  
    // Limpa destaques anteriores
    clearHighlights();
  
    // Define o estado atual como o estado inicial
    let currentState = initialState.innerText;
  
    // Destaque o estado inicial
    await highlightState(currentState);
  
    // Itera sobre cada símbolo da sequência
    for (let i = 0; i < sequence.length; i++) {
      const symbol = sequence[i];
  
      // Verifica se símbolo é válido
      if (symbol !== '0' && symbol !== '1') {
        resultEl.textContent = `Símbolo inválido: ${symbol}`;
        resultEl.style.color = 'red';
        return;
      }
  
      const stateTransitions = transitions[currentState];
  
      // Verifica se há transição
      if (!stateTransitions || !stateTransitions[symbol]) {
        resultEl.textContent = `Sem transição para '${symbol}' a partir de '${currentState}'.`;
        resultEl.style.color = 'red';
        return;
      }
  
      // Avança para o próximo estado
      currentState = stateTransitions[symbol];
      await highlightState(currentState);
    }
  
    // Verifica se o estado final é um estado de aceitação
    const finalStateEl = Array.from(container.children).find(
      el => el.innerText === currentState && el.classList.contains('final')
    );
  
    if (finalStateEl) {
      resultEl.textContent = 'Sequência aceita!';
      resultEl.style.color = 'green';
    } else {
      resultEl.textContent = 'Sequência rejeitada.';
      resultEl.style.color = 'red';
    }
  }
  
  /**
   * Destaca visualmente um estado por um tempo breve (animação)
   */
  function highlightState(name) {
    return new Promise(resolve => {
      const el = Array.from(container.children).find(c => c.innerText === name);
      if (!el) return resolve();
  
      // Salva a cor anterior e aplica destaque
      const originalColor = el.style.backgroundColor;
      el.style.backgroundColor = '#4da6ff'; // azul claro
  
      // Espera 600ms e remove destaque
      setTimeout(() => {
        el.style.backgroundColor = originalColor;
        resolve();
      }, 600);
    });
  }
  
  /**
   * Limpa qualquer destaque anterior nos estados
   */
  function clearHighlights() {
    Array.from(container.children).forEach(el => {
      if (el.classList.contains('state')) {
        el.style.backgroundColor = ''; // remove cor de fundo
      }
    });
  }
