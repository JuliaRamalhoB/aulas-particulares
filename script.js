// ⚠️ SUBSTITUI ESTES DOIS VALORES PELAS TUAS CHAVES DO SUPABASE
const SUPABASE_URL = "https://thnpicjrzqiivnifmhjp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRobnBpY2pyenFpaXZuaWZtaGpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NDU5MzYsImV4cCI6MjA5MzIyMTkzNn0.-vIc6-R6oBZMyJT6SE5hLP5-nZQPNlaft8w6tyomZfE";

// Horários base por dia (em intervalos de 30 minutos)
const horariosPorDia = {
  segunda: ["16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"],
  terca:   ["16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"],
  quarta:  ["15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"],
  quinta:  ["16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"],
  sexta:   ["16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"],
  sabado:  ["15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"],
  domingo: ["15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"]
};

// Quando o utilizador muda o dia, carrega os horários disponíveis
document.getElementById("diaSemana").addEventListener("change", async function() {
  const dia = this.value;
  const selectHorario = document.getElementById("horario");
  const loading = document.getElementById("loadingHorarios");

  selectHorario.innerHTML = '<option value="">A carregar...</option>';
  loading.style.display = "block";

  if (!dia) {
    selectHorario.innerHTML = '<option value="">Escolhe primeiro o dia</option>';
    loading.style.display = "none";
    return;
  }

  // Vai buscar ao Supabase os horários já reservados/confirmados para este dia
  const resposta = await fetch(
    `${SUPABASE_URL}/rest/v1/reservas?dia=eq.${dia}&estado=eq.confirmada&select=horario`,
    {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY,
        "Content-Type": "application/json"
      }
    }
  );

  const reservadas = await resposta.json();
  const horariosOcupados = reservadas.map(r => r.horario);

  // Mostra apenas os horários livres
  const horariosDisponiveis = horariosPorDia[dia].filter(h => !horariosOcupados.includes(h));

  loading.style.display = "none";

  if (horariosDisponiveis.length === 0) {
    selectHorario.innerHTML = '<option value="">Sem horários disponíveis neste dia</option>';
    return;
  }

  selectHorario.innerHTML = '<option value="">Escolhe um horário</option>';
  horariosDisponiveis.forEach(function(hora) {
    const opcao = document.createElement("option");
    opcao.value = hora;
    opcao.textContent = hora;
    selectHorario.appendChild(opcao);
  });
});

// Quando o formulário é submetido
document.getElementById("formReserva").addEventListener("submit", async function(e) {
  e.preventDefault();

  const btn = document.getElementById("btnSubmit");
  btn.textContent = "A enviar...";
  btn.disabled = true;

  const dados = {
    nome:        document.getElementById("nome").value,
    email:       document.getElementById("email").value,
    telefone:    document.getElementById("telefone").value,
    materia:     document.getElementById("materia").value,
    duracao:     document.getElementById("duracao").value,
    dia:         document.getElementById("diaSemana").value,
    horario:     document.getElementById("horario").value,
    observacoes: document.getElementById("observacoes").value,
    estado:      "pendente"
  };

  // Guarda a reserva no Supabase
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
    document.getElementById("mensagemSucesso").style.display = "block";
  } else {
    document.getElementById("mensagemErro").style.display = "block";
    document.getElementById("textoErro").textContent = "Ocorreu um erro. Tenta novamente ou contacta diretamente.";
    btn.textContent = "Enviar pedido de reserva";
    btn.disabled = false;
  }
});