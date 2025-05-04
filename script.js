const container = document.getElementById('container');

let stateCount = 0;
const stateSize = 50, hSpacing = 40, vSpacing = 40, margin = 20;
let nextX = margin, nextY = margin;
let selectedState = null;
let initialState = null;
const transitions = {};

const btnAdd = document.getElementById('addStateBtn');
const btnRemove = document.getElementById('removeStateBtn');
const btnInitial = document.getElementById('markInitialBtn');
const btnFinal = document.getElementById('markFinalBtn');
const btnConfigureTransition = document.getElementById('configureTransitionBtn');

btnAdd.onclick = addState;
btnRemove.onclick = removeState;
btnInitial.onclick = toggleInitial;
btnFinal.onclick = toggleFinal;
btnConfigureTransition.onclick = configureTransition;

function addState() {
    if (stateCount >= 10) return alert('Máximo de 10 estados atingido.');

    if (nextX + stateSize + margin > container.clientWidth) {
        nextX = margin;
        nextY += stateSize + vSpacing;
    }

    if (nextY + stateSize + margin > container.clientHeight) {
        return alert('Não cabe mais estados verticalmente.');
    }

    const name = `q${stateCount++}`;
    const el = document.createElement('div');
    el.className = 'state';
    el.innerText = name;
    el.style.left = `${nextX}px`;
    el.style.top = `${nextY}px`;
    container.appendChild(el);

    transitions[name] = {};
    nextX += stateSize + hSpacing;

    makeSelectableAndDraggable(el);
}

function removeState() {
    if (!selectedState) return alert('Nenhum estado selecionado.');
    if (selectedState === initialState) removeInitialMarker();
    
    const stateName = selectedState.innerText;
    
    // Remove todas as conexões relacionadas
    document.querySelectorAll('.connection-line, .loop-container').forEach(conn => {
        if (conn.dataset.from === stateName || conn.dataset.to === stateName) {
            container.removeChild(conn);
        }
    });
    
    // Remove todos os labels relacionados
    document.querySelectorAll('.transition-label, .self-loop-label').forEach(label => {
        if (label.dataset.from === stateName || label.dataset.to === stateName) {
            if (label.parentNode) {
                label.parentNode.removeChild(label);
            }
        }
    });
    
    container.removeChild(selectedState);
    delete transitions[stateName];
    selectedState = null;
    
    // Remove referências nas transições dos outros estados
    Object.keys(transitions).forEach(key => {
        Object.keys(transitions[key]).forEach(symbol => {
            if (transitions[key][symbol] === stateName) {
                delete transitions[key][symbol];
            }
        });
    });
}

function toggleInitial() {
    if (!selectedState) return alert('Selecione um estado para marcar como inicial.');

    if (initialState === selectedState) {
        removeInitialMarker();
    } else {
        if (initialState) removeInitialMarker();
        initialState = selectedState;
        initialState.classList.add('initial');
        drawInitialArrow(initialState);
    }
}

function toggleFinal() {
    if (!selectedState) return alert('Selecione um estado para marcar como final.');

    if (selectedState.classList.contains('final')) {
        selectedState.classList.remove('final');
        const ic = selectedState.querySelector('.inner-circle');
        if (ic) selectedState.removeChild(ic);
    } else {
        selectedState.classList.add('final');
        const ic = document.createElement('div');
        ic.className = 'inner-circle';
        selectedState.appendChild(ic);
    }
}

function makeSelectableAndDraggable(el) {
    let isDragging = false;
    let startX, startY;
    let dragTimer;
    
    el.addEventListener('mousedown', (e) => {
        if (e.target !== el) return;
        
        e.preventDefault();
        isDragging = false;
        startX = e.clientX;
        startY = e.clientY;
        
        dragTimer = setTimeout(() => {
            isDragging = true;
        }, 100);
        
        function onMouseMove(e) {
            if (!isDragging) return;
            
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                clearTimeout(dragTimer);
                const newX = el.offsetLeft + dx;
                const newY = el.offsetTop + dy;
                
                const boundedX = Math.max(0, Math.min(newX, container.clientWidth - stateSize));
                const boundedY = Math.max(0, Math.min(newY, container.clientHeight - stateSize));
                
                el.style.left = `${boundedX}px`;
                el.style.top = `${boundedY}px`;
                
                startX = e.clientX;
                startY = e.clientY;
                
                updateConnections(el);
            }
        }
        
        function onMouseUp(e) {
            if (!isDragging) {
                selectState(el);
            }
            
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            clearTimeout(dragTimer);
        }
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}

function selectState(el) {
    if (selectedState) {
        selectedState.style.borderColor = '';
    }
    
    if (selectedState !== el) {
        el.style.borderColor = 'red';
        selectedState = el;
    } else {
        selectedState = null;
    }
}

function drawInitialArrow(el) {
    const arrow = document.createElement('div');
    arrow.className = 'initial-arrow';
    arrow.innerHTML = `
        <svg width="40" height="12">
            <line x1="0" y1="6" x2="30" y2="6" stroke="#000" stroke-width="2"/>
            <polygon points="30,1 30,11 40,6" fill="#000"/>
        </svg>
    `;
    el.appendChild(arrow);
}

function removeInitialMarker() {
    if (!initialState) return;
    const arrow = initialState.querySelector('.initial-arrow');
    if (arrow) initialState.removeChild(arrow);
    initialState.classList.remove('initial');
    initialState = null;
}

function configureTransition() {
  if (!selectedState) return alert('Selecione um estado de origem.');
  
  const symbol = prompt(`Digite o símbolo de leitura (0 ou 1):`);
  if (symbol !== '0' && symbol !== '1') return alert('Símbolo inválido. Use apenas 0 ou 1.');
  
  // Verifica se já existe uma transição com este símbolo
  if (transitions[selectedState.innerText][symbol]) {
      if (!confirm(`Já existe uma transição para ${symbol}. Deseja substituir?`)) {
          return;
      }
      // Remove a transição existente
      const existingTarget = transitions[selectedState.innerText][symbol];
      const targetEl = Array.from(container.children).find(c => 
          c.classList.contains('state') && c.innerText === existingTarget);
      if (targetEl) {
          removeExistingConnection(selectedState, targetEl, symbol);
      }
  }
  
  const targetName = prompt('Digite o nome do estado destino (ex: q0):');
  const targetEl = Array.from(container.children).find(c => 
      c.classList.contains('state') && c.innerText === targetName);
  
  if (!targetEl) return alert('Estado destino não encontrado.');

  // Adiciona a nova transição
  transitions[selectedState.innerText][symbol] = targetName;
  drawConnection(selectedState, targetEl, symbol);
}

function drawConnection(fromEl, toEl, symbol) {
    removeExistingConnection(fromEl, toEl, symbol);

    // Caso especial para auto-transição
    if (fromEl === toEl) {
        drawSelfLoop(fromEl, symbol);
        return;
    }

    const line = document.createElement('div');
    line.className = 'connection-line';

    const label = document.createElement('div');
    label.className = 'transition-label';
    label.textContent = symbol;

    // Cálculo das posições (garantindo que a linha comece e termine nas bordas)
    const fromX = fromEl.offsetLeft + stateSize / 2;
    const fromY = fromEl.offsetTop + stateSize / 2;
    const toX = toEl.offsetLeft + stateSize / 2;
    const toY = toEl.offsetTop + stateSize / 2;

    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    const distance = Math.sqrt(dx * dx + dy * dy);

    const radius = stateSize / 2;
    const startX = fromX + radius * Math.cos(angle);
    const startY = fromY + radius * Math.sin(angle);
    const endX = toX - radius * Math.cos(angle);
    const endY = toY - radius * Math.sin(angle);

    const adjustedDx = endX - startX;
    const adjustedDy = endY - startY;
    const adjustedDistance = Math.sqrt(adjustedDx * adjustedDx + adjustedDy * adjustedDy);

    line.style.width = `${adjustedDistance}px`;
    line.style.left = `${startX}px`;
    line.style.top = `${startY}px`;
    line.style.transform = `rotate(${angle}rad)`;
    line.dataset.from = fromEl.innerText;
    line.dataset.to = toEl.innerText;
    line.dataset.symbol = symbol;

    // Posiciona o rótulo no meio da linha
    const labelX = startX + adjustedDx * 0.5 - 10;
    const labelY = startY + adjustedDy * 0.5 - 8;
    label.style.left = `${labelX}px`;
    label.style.top = `${labelY}px`;
    label.dataset.from = fromEl.innerText;
    label.dataset.to = toEl.innerText;
    label.dataset.symbol = symbol;

    container.appendChild(line);
    container.appendChild(label);
}

function drawSelfLoop(stateEl, symbol) {
    removeExistingConnection(stateEl, stateEl, symbol);
    
    // Criando container para o loop
    const loopContainer = document.createElement('div');
    loopContainer.className = 'loop-container';
    
    // Criando o SVG para o loop com dimensões maiores
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'self-loop-svg');
    svg.setAttribute('width', '100');
    svg.setAttribute('height', '100');
    
    // Obter o centro do estado
    const stateRadius = stateSize / 2;
    
    // Desenha o caminho da seta
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    // Começar na lateral direita do estado
    // Curvar para fora (direita), depois para cima, fazer o arco e voltar ao topo do estado
    path.setAttribute('d', `M ${stateRadius+2},${stateRadius} 
                           C ${stateRadius+30},${stateRadius} 
                             ${stateRadius+30},0 
                             ${stateRadius},5`);
    
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#333');
    path.setAttribute('stroke-width', '2');
    
    // Adicionando marcador de seta no final do caminho
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', `arrowhead-${stateEl.innerText}-${symbol}`);
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '7');
    marker.setAttribute('refX', '0');
    marker.setAttribute('refY', '3.5');
    marker.setAttribute('orient', 'auto');
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
    polygon.setAttribute('fill', '#333');
    
    marker.appendChild(polygon);
    
    // Adicionando definições SVG
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.appendChild(marker);
    svg.appendChild(defs);
    
    // Adicionando marcador de seta ao caminho
    path.setAttribute('marker-end', `url(#arrowhead-${stateEl.innerText}-${symbol})`);
    
    svg.appendChild(path);
    
    // Criação do label
    const label = document.createElement('div');
    label.className = 'self-loop-label';
    label.textContent = symbol;
    label.style.position = 'absolute';
    label.style.top = '20px';
    label.style.right = '20px';
    
    // Posicionamento do container do loop relativo ao estado
    loopContainer.style.position = 'absolute';
    loopContainer.style.left = `${stateEl.offsetLeft}px`;
    loopContainer.style.top = `${stateEl.offsetTop - 50}px`;
    loopContainer.style.width = `${stateSize + 50}px`;
    loopContainer.style.height = `${stateSize + 50}px`;
    loopContainer.style.pointerEvents = 'none';
    
    // Atributos de dados
    loopContainer.dataset.from = stateEl.innerText;
    loopContainer.dataset.to = stateEl.innerText;
    loopContainer.dataset.symbol = symbol;
    
    // Montagem dos elementos
    loopContainer.appendChild(svg);
    loopContainer.appendChild(label);
    container.appendChild(loopContainer);
    
    // Armazenamento de referência para atualizações futuras
    if (!stateEl.loopContainers) stateEl.loopContainers = [];
    stateEl.loopContainers.push(loopContainer);
}

// Função atualizada para mover o loop junto com o estado
function updateLoopPosition(stateEl, loopContainer) {
    loopContainer.style.left = `${stateEl.offsetLeft}px`;
    loopContainer.style.top = `${stateEl.offsetTop - 50}px`;
}

function removeExistingConnection(fromEl, toEl, symbol) {
    // Remove conexões normais
    document.querySelectorAll('.connection-line').forEach(conn => {
        if (conn.dataset.from === fromEl.innerText && 
            conn.dataset.to === toEl.innerText && 
            conn.dataset.symbol === symbol) {
            container.removeChild(conn);
        }
    });
    
    // Remove auto-conexões
    if (fromEl === toEl) {
        document.querySelectorAll('.loop-container').forEach(container => {
            if (container.dataset.from === fromEl.innerText && 
                container.dataset.to === toEl.innerText && 
                container.dataset.symbol === symbol) {
                if (container.parentNode) {
                    container.parentNode.removeChild(container);
                }
            }
        });
    }
    
    // Remove labels
    document.querySelectorAll('.transition-label, .self-loop-label').forEach(label => {
        if (label.textContent === symbol && 
            label.dataset.from === fromEl.innerText && 
            label.dataset.to === toEl.innerText) {
            if (label.parentNode) {
                label.parentNode.removeChild(label);
            }
        }
    });
}

function updateConnections(stateEl) {
    const stateName = stateEl.innerText;
    
    // Atualiza conexões normais
    document.querySelectorAll('.connection-line').forEach(conn => {
        if (conn.dataset.from === stateName || conn.dataset.to === stateName) {
            const fromEl = Array.from(container.children).find(c => 
                c.classList.contains('state') && c.innerText === conn.dataset.from);
            const toEl = Array.from(container.children).find(c => 
                c.classList.contains('state') && c.innerText === conn.dataset.to);
            
            if (fromEl && toEl) {
                const symbol = conn.dataset.symbol;
                container.removeChild(conn);
                
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
                
                drawConnection(fromEl, toEl, symbol);
            }
        }
    });
    
    // Atualiza auto-conexões
    document.querySelectorAll('.loop-container').forEach(container => {
        if (container.dataset.from === stateName && container.dataset.to === stateName) {
            updateLoopPosition(stateEl, container);
        }
    });
}

// Seleciona o botão de teste e adiciona um ouvinte de evento de clique
document.getElementById('testBtn').addEventListener('click', testSequence);

/**
 * Função para testar a sequência inserida pelo usuário no AFD criado
 */
/**
 * Função para testar a sequência inserida pelo usuário no AFD criado,
 * e destacar o caminho percorrido no autômato.
 */
async function testSequence() {
    const sequence = document.getElementById('inputSequence').value.trim();
    const resultEl = document.getElementById('testResult');
  
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