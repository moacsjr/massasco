'use client';

import React, { useState, useEffect } from 'react';
import * as QRCode from 'qrcode';

interface PixProps {
  chave: string;
  beneficiario: string;
  cidade: string;
  valor?: number;
  txid?: string;
}

export const ComponentePix: React.FC<PixProps> = ({
  chave,
  beneficiario,
  cidade,
  valor = 0,
  txid = '***'
}) => {
  const [qrcodeUrl, setQrcodeUrl] = useState<string>('');
  const [pixString, setPixString] = useState<string>('');
  const [copiado, setCopiado] = useState<boolean>(false);

  // --- Lógica de Geração do PIX (Rodando no Client-Side) ---
  useEffect(() => {
    // Helper para limpar texto (remover acentos)
    const limparTexto = (texto: string) => 
      texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

    const nomeTratado = limparTexto(beneficiario).substring(0, 25);
    const cidadeTratada = limparTexto(cidade).substring(0, 15);

    // Função auxiliar para criar campos formatados: ID + Tamanho (2 dígitos) + Conteúdo
    const f = (id: string, conteudo: string) => 
      `${id}${conteudo.length.toString().padStart(2, '0')}${conteudo}`;

    // Subpayload de conta: ID 00 (br.gov.bcb.pix) + ID 01 (chave PIX)
    const subPayloadConta = f("00", "br.gov.bcb.pix") + f("01", chave);
    
    // Subpayload adicional: ID 05 (txid)
    const subPayloadAdicional = f("05", txid);

    // Montagem do payload principal
    let payload = 
      f("00", "01") +           // ID 00: Versão do payload (01)
      f("26", subPayloadConta) + // ID 26: Subpayload de conta
      f("52", "0000") +         // ID 52: Código de finalidade (0000 = pagamento)
      f("53", "986");           // ID 53: Código do país (986 = Brasil)

    if (valor > 0) {
      payload += f("54", valor.toFixed(2)); // ID 54: Valor (opcional)
    }

    payload += 
      f("58", "BR") +           // ID 58: Código do país do beneficiário
      f("59", nomeTratado) +    // ID 59: Nome do beneficiário
      f("60", cidadeTratada) +  // ID 60: Cidade do beneficiário
      f("62", subPayloadAdicional); // ID 62: Campo adicional (txid)

    // Cálculo do CRC16 seguindo o padrão do PIX
    // O CRC é calculado sobre a string completa + "6304" (ID do campo CRC)
    // O resultado substitui o "6304" no final
    const calcularCrc16 = (str: string): string => {
      // Adiciona o ID do campo CRC para cálculo
      const strParaCrc = str + "6304";
      let crc = 0xFFFF;
      
      for (let i = 0; i < strParaCrc.length; i++) {
        crc ^= strParaCrc.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
          if ((crc & 0x8000) !== 0) {
            crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
          } else {
            crc = (crc << 1) & 0xFFFF;
          }
        }
      }
      
      // Retorna o ID do campo (6304) + o valor do CRC calculado
      return `6304${crc.toString(16).toUpperCase().padStart(4, '0')}`;
    };

    // Gera a string final do PIX com CRC
    const stringFinalPix = payload + calcularCrc16(payload).substring(4);
    setPixString(stringFinalPix);

    // Gera o QR Code em Base64 para a tag <img>
    QRCode.toDataURL(stringFinalPix, { width: 250, margin: 2 })
      .then(url => setQrcodeUrl(url))
      .catch(err => console.error("Erro ao gerar QR Code:", err));

  }, [chave, beneficiario, cidade, valor, txid]);

  // --- Função para Copiar o Código ---
  const handleCopiar = async () => {
    try {
      await navigator.clipboard.writeText(pixString);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000); // Reseta o botão após 3 segundos
    } catch (err) {
      console.error("Falha ao copiar código", err);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex flex-col items-center justify-center font-sans">
      <div className="flex items-center gap-2 mb-4">
        {/* Ícone Simbólico do Pix */}
        <span className="text-teal-500 font-extrabold text-xl tracking-wider">pix</span>
        <span className="text-xs bg-teal-100 text-teal-800 font-semibold px-2 py-0.5 rounded-full">
          Pagar com QR Code
        </span>
      </div>

      {valor > 0 && (
        <div className="text-center mb-4">
          <p className="text-sm text-gray-500">Valor a pagar</p>
          <p className="text-2xl font-bold text-gray-800">
            {valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      )}

      {/* Box do QR Code */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 flex items-center justify-center min-h-[250px] min-w-[250px]">
        {qrcodeUrl ? (
          <img src={qrcodeUrl} alt="QR Code do PIX" className="w-full h-auto rounded-lg" />
        ) : (
          <div className="animate-pulse flex space-x-4">
            <div className="bg-gray-300 h-48 w-48 rounded"></div>
          </div>
        )}
      </div>

      <div className="w-full">
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Pix Copiar e Colar
        </label>
        
        {/* Campo de texto truncado */}
        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-2.5 mb-4 text-xs font-mono text-gray-600 select-all overflow-hidden whitespace-nowrap text-ellipsis">
          {pixString || "Gerando código..."}
        </div>

        {/* Botão Dinâmico de Copiar */}
        <button
          onClick={handleCopiar}
          disabled={!pixString}
          className={`w-full py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 text-white ${
            copiado 
              ? 'bg-green-600 shadow-md shadow-green-100' 
              : 'bg-teal-600 hover:bg-teal-700 active:scale-[0.98]'
          } disabled:opacity-50`}
        >
          {copiado ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              Copiado com sucesso!
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
              Copiar código PIX
            </>
          )}
        </button>
      </div>
    </div>
  );
};