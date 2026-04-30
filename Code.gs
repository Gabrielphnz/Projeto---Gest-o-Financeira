function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('Gestão Financeira')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1'); 
}

const ID_PLANILHA = '1_DRm2kIlnWD5ZIMJxgnVmInqDAZsqxMlPd4CTC2OmKg'; 

function salvarLancamento(dados) {
  const planilha = SpreadsheetApp.openById(ID_PLANILHA).getSheetByName('Principal');
  const timestamp = new Date();
  const id = dados.id || Utilities.getUuid(); // Usa ID existente (edição) ou gera novo (criação)
  
  if (dados.id) {
    // LÓGICA DE EDIÇÃO
    const data = planilha.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === dados.id) {
        const linhaReal = i + 1;
        planilha.getRange(linhaReal, 4).setValue(dados.dataVencimento); // D
        planilha.getRange(linhaReal, 6).setValue(dados.formaPagamento);  // F (Sua regra mantida)
        planilha.getRange(linhaReal, 7).setValue(dados.categoria);       // G
        planilha.getRange(linhaReal, 9).setValue(dados.descricao);       // I
        planilha.getRange(linhaReal, 13).setValue(dados.valorBruto);      // M
        planilha.getRange(linhaReal, 19).setValue(dados.status);          // S
        return "Editado com sucesso";
      }
    }
  } else {
    // LÓGICA DE CRIAÇÃO
    const linha = [];
    linha[0] = id; 
    linha[1] = timestamp; 
    linha[3] = dados.dataVencimento || ''; 
    linha[5] = dados.formaPagamento || ''; 
    linha[6] = dados.categoria || ''; 
    linha[8] = dados.descricao || ''; 
    linha[12] = dados.valorBruto || ''; 
    linha[18] = dados.status || 'Pendente'; 
    planilha.appendRow(linha);
    return "Criado com sucesso";
  }
}

function excluirLancamento(id) {
  const planilha = SpreadsheetApp.openById(ID_PLANILHA).getSheetByName('Principal');
  const data = planilha.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      planilha.deleteRow(i + 1);
      return "Excluído com sucesso";
    }
  }
  throw new Error("Lançamento não encontrado.");
}

function obterLancamentos() {
  const planilha = SpreadsheetApp.openById(ID_PLANILHA).getSheetByName('Principal');
  
  // Trava de segurança: se a aba não for encontrada
  if (!planilha) {
    throw new Error("Aba 'Principal' não encontrada.");
  }

  const dados = planilha.getDataRange().getValues();
  
  // Trava de segurança: se a planilha estiver vazia ou só tiver o cabeçalho
  if (dados.length <= 1) {
    return []; 
  }
  
  dados.shift(); // Remove a primeira linha (cabeçalho)
  
  return dados.map(linha => ({
    id: linha[0] || '',
    dataVencBruta: linha[3] || '', 
    dataVenc: linha[3] ? Utilities.formatDate(new Date(linha[3]), Session.getScriptTimeZone(), "dd/MM/yyyy") : '-',
    formaPgto: linha[5] || '', 
    categoria: linha[6] || '',
    descricao: linha[8] || '', 
    valor: parseFloat(linha[12]) || 0, 
    status: linha[18] || 'Pendente' 
  })).reverse(); 
}
