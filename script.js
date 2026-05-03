const SUPABASE_URL = "https://thnpicjrzqiivnifmhjp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRobnBpY2pyenFpaXZuaWZtaGpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NDU5MzYsImV4cCI6MjA5MzIyMTkzNn0.-vIc6-R6oBZMyJT6SE5hLP5-nZQPNlaft8w6tyomZfE";

const DIAS_DISPONIVEIS = [0, 1, 2, 3, 4, 5, 6];

const horariosPorDia = {
  0: ["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30"], // Dom
  1: ["16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30"], // Seg
  2: ["16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30"], // Ter
  3: ["15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30"], // Qua
  4: ["16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30"], // Qui
  5: ["16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30"], // Sex
  6: ["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30"]  // Sáb
};

const nomesMeses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const nomesDias = ["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"];

let mesAtual = new Date().getMonth();
let anoAtual = new Date().getFullYear();
let reservasDoMes = {};
let dataSelecionada = null;

// Função segura para criar data sem problema de fuso
function criarData(dataStr) {
  const [ano, mes, dia] = dataStr.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

async function carregarReservasDoMes(ano, mes) {
  const inicio = `${ano}-${String(mes+1).padStart(2,'0')}-01`;
  const fim = `${ano}-${String(mes+1).padStart(2,'0')}-31`;

  const resposta = await fetch(
    `${SUPABASE_URL}/rest/v1/reservas?data_aula=gte.${inicio}&data_aula=lte.${fim}&estado=eq.confirmada&select=data_aula,horario`,
    { headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY } }
  );

  const dados = await resposta.json();
  reservasDoMes = {};
  dados.forEach(r => {
    if (!reservasDoMes[r.data_aula]) reservasDoMes[r.data_aula] = [];
    reservasDoMes[r.data_aula].push(r.horario);
  });
}

async function renderizarCalendario() {
  document.getElementById("mesAno").textContent = `${nomesMeses[mesAtual]} ${anoAtual}`;
  await carregarReservasDoMes(anoAtual, mesAtual);

  const grid = document.getElementById("calDias");
  grid.innerHTML = "";

  const primeiroDia = new Date(anoAtual, mesAtual, 1).getDay();
  const totalDias = new Date(anoAtual, mesAtual + 1, 0).getDate();
  const hoje = new Date();
  hoje.setHours(0,0,0,0);

  for (let i = 0; i < primeiroDia; i++) {
    const vazio = document.createElement("div");
    vazio.className = "cal-dia vazio";
    grid.appendChild(vazio);
  }

  for (let d = 1; d <= totalDias; d++) {
    const data = new Date(anoAtual, mesAtual, d);
    const diaSemana = data.getDay();
    const dataStr = `${anoAtual}-${String(mesAtual+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

    const div = document.createElement("div");
    div.className = "cal-dia";
    div.textContent = d;

    if (data < hoje) {
      div.classList.add("passado");
    } else if (!DIAS_DISPONIVEIS.includes(diaSemana)) {
      div.classList.add("indisponivel");
    } else {
      const totalHorarios = horariosPorDia[diaSemana].length;
      const ocupados = reservasDoMes[dataStr] ? reservasDoMes[dataStr].length : 0;

      if (ocupados >= totalHorarios) {
        div.classList.add("lotado");
      } else if (ocupados > 0) {
        div.classList.add("parcial");
        div.classList.add("clicavel");
        div.addEventListener("click", () => selecionarDia(dataStr, diaSemana, d));
      } else {
        div.classList.add("disponivel");
        div.classList.add("clicavel");
        div.addEventListener("click", () => selecionarDia(dataStr, diaSemana, d));
      }

      if (dataStr === dataSelecionada) div.classList.add("selecionado");
    }

    grid.appendChild(div);
  }
}

async function selecionarDia(dataStr, diaSemana, dia) {
  dataSelecionada = dataStr;
  document.getElementById("formContainer").style.display = "none";
  document.getElementById("secaoHorarios").style.display = "block";
  document.getElementById("tituloHorarios").textContent = `${nomesDias[diaSemana]}, ${dia} de ${nomesMeses[mesAtual]}`;

  const grade = document.getElementById("gradeHorarios");
  grade.innerHTML = "<p style='color:#888'>A carregar horários...</p>";

  const resposta = await fetch(
    `${SUPABASE_URL}/rest/v1/reservas?data_aula=eq.${dataStr}&estado=eq.confirmada&select=horario,duracao`,
    { headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY } }
  );

  const aulasConfirmadas = await resposta.json();
  const duracaoParaSlots = { "1h": 2, "1h30": 3, "2h": 4 };
  const todosHorarios = horariosPorDia[diaSemana];
  const horariosOcupados = new Set();

  aulasConfirmadas.forEach(aula => {
    const slots = duracaoParaSlots[aula.duracao] || 2;
    const idxInicio = todosHorarios.indexOf(aula.horario);
    if (idxInicio === -1) return;
    for (let i = idxInicio; i < idxInicio + slots && i < todosHorarios.length; i++) {
      horariosOcupados.add(todosHorarios[i]);
    }
  });

  // Bloqueia horários onde nenhuma duração cabe sem colidir
  const horariosQueNaoPodeComecar = new Set();
  todosHorarios.forEach((hora, idx) => {
    let algumaCabe = false;
    [2, 3, 4].forEach(slots => {
      if (idx + slots > todosHorarios.length) return;
      let colidiu = false;
      for (let i = idx; i < idx + slots; i++) {
        if (horariosOcupados.has(todosHorarios[i])) { colidiu = true; break; }
      }
      if (!colidiu) algumaCabe = true;
    });
    if (!algumaCabe) horariosQueNaoPodeComecar.add(hora);
  });

  grade.innerHTML = "";
  todosHorarios.forEach(hora => {
    const btn = document.createElement("button");
    btn.textContent = hora;
    btn.className = "btn-horario";

    if (horariosOcupados.has(hora) || horariosQueNaoPodeComecar.has(hora)) {
      btn.classList.add("ocupado");
      btn.disabled = true;
    } else {
      btn.classList.add("livre");
      btn.addEventListener("click", () => selecionarHorario(hora, diaSemana, dia));
    }
    grade.appendChild(btn);
  });

  renderizarCalendario();
}

function selecionarHorario(hora, diaSemana, dia) {
  document.getElementById("horarioEscolhido").value = hora;
  document.getElementById("dataEscolhida").value = dataSelecionada;
  document.getElementById("tituloFormulario").textContent =
    `📋 Reservar: ${nomesDias[diaSemana]}, ${dia} de ${nomesMeses[mesAtual]} às ${hora}`;
  document.getElementById("secaoHorarios").style.display = "none";
  document.getElementById("formContainer").style.display = "block";
}

document.getElementById("btnVoltar").addEventListener("click", () => {
  document.getElementById("formContainer").style.display = "none";
  document.getElementById("secaoHorarios").style.display = "block";
});

document.getElementById("formReserva").addEventListener("submit", async function(e) {
  e.preventDefault();

  const btn = document.getElementById("btnSubmit");
  btn.textContent = "A enviar...";
  btn.disabled = true;

  const dataStr = document.getElementById("dataEscolhida").value;
  const dataObj = criarData(dataStr);

  const dados = {
    nome:        document.getElementById("nome").value,
    email:       document.getElementById("email").value,
    telefone:    document.getElementById("telefone").value,
    materia:     document.getElementById("materia").value,
    duracao:     document.getElementById("duracao").value,
    dia:         nomesDias[dataObj.getDay()],
    horario:     document.getElementById("horarioEscolhido").value,
    data_aula:   dataStr,
    observacoes: document.getElementById("observacoes").value,
    estado:      "pendente"
  };

  const resposta = await fetch(`${SUPABASE_URL}/rest/v1/reservas`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": "Bearer " + SUPABASE_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(dados)
  });

  if (resposta.ok) {
    document.getElementById("formContainer").style.display = "none";
    document.getElementById("secaoHorarios").style.display = "none";
    document.getElementById("mensagemSucesso").style.display = "block";
  } else {
    document.getElementById("mensagemErro").style.display = "block";
    document.getElementById("textoErro").textContent = "Ocorreu um erro. Tenta novamente.";
    btn.textContent = "Enviar pedido de reserva";
    btn.disabled = false;
  }
});

document.getElementById("btnMesAnterior").addEventListener("click", () => {
  mesAtual--;
  if (mesAtual < 0) { mesAtual = 11; anoAtual--; }
  renderizarCalendario();
});

document.getElementById("btnProximoMes").addEventListener("click", () => {
  mesAtual++;
  if (mesAtual > 11) { mesAtual = 0; anoAtual++; }
  renderizarCalendario();
});

renderizarCalendario();