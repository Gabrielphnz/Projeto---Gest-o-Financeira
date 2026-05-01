const ID_PLANILHA = '1_DRm2kIlnWD5ZIMJxgnVmInqDAZsqxMlPd4CTC2OmKg'; 

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('Gestão Financeira')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0');
}

// NOVO: Busca a lista de cartões cadastrados na aba 'Cartoes'
function obterCartoes() {
  const ss = SpreadsheetApp.openById(ID_PLANILHA);
  let abaCartoes = ss.getSheetByName('Cartoes');
  
  if (!abaCartoes) {
    // Cria a aba se ela não existir para não dar erro
    abaCartoes = ss.insertSheet('Cartoes');
    abaCartoes.getRange('A1').setValue('Nome do Cartão');
    return [];
  }
  
  const dados = abaCartoes.getDataRange().getValues();
  if (dados.length <= 1) return [];
  
  dados.shift(); // Remove cabeçalho
  return dados.map(linha => linha[0]).filter(nome => nome !== "");
}

function salvarLancamento(dados) {
  const planilha = SpreadsheetApp.openById(ID_PLANILHA).getSheetByName('Principal');
  const timestamp = new Date();
  const data = planilha.getDataRange().getValues();
  
  let valorFormatado = parseFloat((dados.valorBruto || '0').toString().replace(',', '.')) || 0;

  // Se for Cartão de Crédito, podemos anexar o nome do cartão à descrição ou usar uma coluna específica
  // Para manter sua estrutura, vamos anexar à observação/categoria ou apenas salvar
  const formaFinal = dados.cartaoSelecionado ? `Cartão: ${dados.cartaoSelecionado}` : dados.formaPagamento;

  if (dados.id) {
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == dados.id) { 
        const linhaReal = i + 1;
        planilha.getRange(linhaReal, 3).setValue(dados.tipo); 
        planilha.getRange(linhaReal, 4).setValue(dados.dataVencimento); 
        planilha.getRange(linhaReal, 6).setValue(formaFinal); // F
        planilha.getRange(linhaReal, 7).setValue(dados.categoria); 
        planilha.getRange(linhaReal, 9).setValue(dados.descricao); 
        planilha.getRange(linhaReal, 13).setValue(valorFormatado); 
        planilha.getRange(linhaReal, 19).setValue(dados.status); 
        return "Editado com sucesso";
      }
    }
  } else {
    let novoId = 1;
    if (data.length > 1) {
      const ids = data.slice(1).map(linha => parseInt(linha[0]) || 0);
      novoId = Math.max(...ids) + 1;
    }
    
    const linha = new Array(19).fill('');
    linha[0] = novoId;
    linha[1] = timestamp;
    linha[2] = dados.tipo;
    linha[3] = dados.dataVencimento;
    linha[5] = formaFinal; // F
    linha[6] = dados.categoria;
    linha[8] = dados.descricao;
    linha[12] = valorFormatado;
    linha[18] = dados.status || 'Pendente';
    
    planilha.appendRow(linha);
    return "Criado com sucesso";
  }
}


function excluirLancamento(id) {
  const planilha = SpreadsheetApp.openById(ID_PLANILHA).getSheetByName('Principal');
  const data = planilha.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      planilha.deleteRow(i + 1);
      return "Excluído com sucesso";
    }
  }
  throw new Error("Lançamento não encontrado.");
}

function obterLancamentos() {
  const planilha = SpreadsheetApp.openById(ID_PLANILHA).getSheetByName('Principal');
  if (!planilha) throw new Error("Aba 'Principal' não encontrada.");

  const dados = planilha.getDataRange().getValues();
  if (dados.length <= 1) return [];
  
  dados.shift(); // Remove cabeçalho

  return dados
    .filter(linha => (linha[8] !== "" || linha[12] !== ""))
    .map((linha, index) => {
      let valorNumerico = 0;
      if (linha[12] !== "" && linha[12] != null) {
        valorNumerico = typeof linha[12] === 'number' ? linha[12] : parseFloat(linha[12].toString().replace(',', '.'));
      }
      
      let dataBrutaStr = '';
      let dataFormatadaStr = '-';
      
      if (linha[3] instanceof Date) {
        dataBrutaStr = linha[3].toISOString(); 
        dataFormatadaStr = Utilities.formatDate(linha[3], Session.getScriptTimeZone(), "dd/MM/yyyy");
      } else if (linha[3]) {
        dataBrutaStr = linha[3].toString();
        dataFormatadaStr = linha[3].toString();
      }

      // Se a coluna C estiver vazia (dados antigos), assume como Despesa por padrão
      const tipoLancamento = linha[2] ? linha[2].toString().trim() : 'Despesa';

      return {
        id: linha[0] ? linha[0].toString() : ('antigo_' + index),
        tipo: tipoLancamento, // Receita ou Despesa
        dataVencBruta: dataBrutaStr,
        dataVenc: dataFormatadaStr,
        formaPgto: (linha[5] || '').toString(), 
        categoria: (linha[6] || '').toString(), 
        descricao: (linha[8] || '').toString(), 
        valor: isNaN(valorNumerico) ? 0 : valorNumerico, 
        status: linha[18] ? linha[18].toString() : 'Pendente' 
      };
    })
    .reverse();
}
