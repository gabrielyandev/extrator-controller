// script.js (Versão para Excel - Muito mais simples)

document.addEventListener("DOMContentLoaded", () => {
  // --- CONFIGURAÇÃO E ELEMENTOS DO DOM ---
  const uploadArea = document.getElementById("upload-area");
  const fileInput = document.getElementById("file-upload");
  const statusBox = document.getElementById("status-box");
  const statusIcon = document.getElementById("status-icon");
  const statusMessage = document.getElementById("status-message");
  const resultSection = document.getElementById("result-section");
  const fileNameDiv = document.getElementById("file-name");

  // --- LÓGICA DE UPLOAD E INTERFACE ---
  uploadArea.addEventListener("click", () => fileInput.click());

  ["dragover", "dragenter"].forEach((eventName) => {
    uploadArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      uploadArea.classList.add("highlight");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    uploadArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      uploadArea.classList.remove("highlight");
    });
  });

  uploadArea.addEventListener("drop", (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFileSelect(files[0]);
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) handleFileSelect(e.target.files[0]);
  });

  function handleFileSelect(file) {
    fileNameDiv.textContent = file.name;
    updateStatus("Arquivo recebido. A processar...", "processing", "spinner");
    resultSection.innerHTML = "";

    const reader = new FileReader();
    reader.onload = (e) => {
      processExcelData(e.target.result);
    };
    reader.readAsArrayBuffer(file);
  }

  function updateStatus(message, type, iconName = "info") {
    statusBox.className = `status-box ${type}`;
    statusMessage.textContent = message;
    if (iconName === "spinner") {
      statusIcon.innerHTML = '<div class="spinner"></div>';
    } else {
      statusIcon.innerHTML = `<span class="material-symbols-outlined">${iconName}</span>`;
    }
  }

  // --- LÓGICA DE PROCESSAMENTO DO EXCEL ---
  function processExcelData(arrayBuffer) {
    try {
      const data = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Converte a folha de cálculo numa lista de objetos (JSON)
      // Cada linha do excel torna-se um objeto.
      const allRows = XLSX.utils.sheet_to_json(worksheet);

      // Filtra os dados - muito mais simples!
      const positiveSuggestions = allRows.filter((row) => {
        // Verifica se a coluna "Sugestão" existe e se o seu valor é maior que zero
        return row["Sugestão"] && parseFloat(row["Sugestão"]) > 0;
      });

      displayResults(positiveSuggestions);
    } catch (error) {
      console.error("Erro ao processar o arquivo Excel:", error);
      updateStatus(`Erro ao ler o arquivo: ${error.message}`, "error", "error");
    }
  }

  // --- LÓGICA DE EXIBIÇÃO DE RESULTADOS ---
  function displayResults(data) {
    resultSection.innerHTML = "";
    if (data.length === 0) {
      updateStatus(
        "Concluído. Nenhuma sugestão positiva foi encontrada no relatório.",
        "success",
        "check_circle"
      );
      return;
    }

    updateStatus(
      `Sucesso! Foram encontradas ${data.length} sugestões positivas.`,
      "success",
      "check_circle"
    );

    const title = document.createElement("h2");
    title.textContent = "Resultados da Extração";

    const table = document.createElement("table");
    table.innerHTML = `
            <thead>
                <tr>
                    <th>Estabelecimento</th>
                    <th>Código do Produto</th>
                    <th>Nome do Produto</th>
                    <th>Sugestão</th>
                </tr>
            </thead>
            <tbody>
                ${data
                  .map(
                    (item) => `
                    <tr>
                        <td>${item["Estabelecimento"] || "N/A"}</td>
                        <td>${item["Código do Produto"] || "N/A"}</td>
                        <td>${item["Nome do Produto"] || "N/A"}</td>
                        <td>${parseFloat(item["Sugestão"])
                          .toFixed(2)
                          .replace(".", ",")}</td>
                    </tr>
                `
                  )
                  .join("")}
            </tbody>
        `;

    const downloadButton = document.createElement("button");
    downloadButton.className = "download-button";
    downloadButton.innerHTML = `<span class="material-symbols-outlined">download</span> Baixar CSV`;
    downloadButton.onclick = () => downloadCSV(data);

    resultSection.appendChild(title);
    resultSection.appendChild(table);
    resultSection.appendChild(downloadButton);
  }

  function downloadCSV(data) {
    // Converte os dados para o formato de CSV
    const csvData = XLSX.utils.json_to_sheet(data);
    const csvOutput = XLSX.utils.sheet_to_csv(csvData, { separator: ";" });

    const blob = new Blob(["\uFEFF" + csvOutput], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", "sugestoes_positivas.csv");
    document.body.appendChild(link);

    link.click();
    document.body.removeChild(link);
  }
});
