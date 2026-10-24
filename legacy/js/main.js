/* ===== MindStudy · Reloj de hoja (flip clock hecho a mano) ===== */

const clock = document.getElementById("clock");

// Un dígito tiene 4 capas:
//   upper/lower      -> las mitades fijas (de fondo)
//   leaf-upper/lower -> las "hojas" que voltean
function crearDigito() {
    const digito = document.createElement("div");
    digito.className = "digit";
    digito.dataset.value = "0";
    digito.innerHTML = `
        <div class="upper"><span>0</span></div>
        <div class="lower"><span>0</span></div>
        <div class="leaf leaf-upper"><span>0</span></div>
        <div class="leaf leaf-lower"><span>0</span></div>
    `;
    return digito;
}

// Armamos los 6 dígitos: HH : MM : SS
const digitos = [];
for (let i = 0; i < 6; i++) {
    if (i === 2 || i === 4) {
        const sep = document.createElement("span");
        sep.className = "sep";
        sep.textContent = ":";
        clock.appendChild(sep);
    }
    const digito = crearDigito();
    clock.appendChild(digito);
    digitos.push(digito);
}

// Cambia un dígito y dispara el volteo
function ponerDigito(digito, valor) {
    if (digito.dataset.value === valor) return;

    const [upper, lower, leafUpper, leafLower] = digito.children;
    const viejo = digito.dataset.value;
    digito.dataset.value = valor;

    upper.querySelector("span").textContent = valor;      // queda detrás: se revela al caer la hoja
    leafUpper.querySelector("span").textContent = viejo;  // la hoja de arriba cae mostrando el viejo
    leafLower.querySelector("span").textContent = valor;  // la hoja de abajo se despliega mostrando el nuevo

    digito.classList.remove("flipping");
    void digito.offsetWidth;   // truco: fuerza al navegador a reiniciar la animación
    digito.classList.add("flipping");

    // Al terminar, dejamos las mitades fijas en el valor nuevo
    setTimeout(() => {
        lower.querySelector("span").textContent = valor;
        leafUpper.querySelector("span").textContent = valor;
    }, 500);
}

// Pinta una hora completa, ej: "142530"
function pintarHora(texto) {
    for (let i = 0; i < 6; i++) {
        ponerDigito(digitos[i], texto[i]);
    }
}

// Reloj en vivo: se realinea solo al inicio de cada segundo
function tic() {
    const ahora = new Date();
    const hh = String(ahora.getHours()).padStart(2, "0");
    const mm = String(ahora.getMinutes()).padStart(2, "0");
    const ss = String(ahora.getSeconds()).padStart(2, "0");
    pintarHora(hh + mm + ss);
    setTimeout(tic, 1000 - (Date.now() % 1000));
}

tic();
