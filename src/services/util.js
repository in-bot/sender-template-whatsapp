require('dotenv').config();
const process = require('process');
const crypto = require('node:crypto');

const dateAddMinute = function (date, minute) {
    return new Date(date.getTime() + (minute * 60000));
}

const dateAddDays = function (date, days) {
    date.setDate(date.getDate() + days);
    return date;
}

const firstDayMonth = function (date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

const lastDayMonth = function (date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

const dateToString = function date2str(date, format) {
    var z = {
        M: date.getMonth() + 1,
        d: date.getDate(),
        h: date.getHours(),
        m: date.getMinutes(),
        s: date.getSeconds()
    };
    format = format.replace(/(M+|d+|h+|m+|s+)/g, function (v) {
        return ((v.length > 1 ? "0" : "") + eval('z.' + v.slice(-1))).slice(-2)
    });

    return format.replace(/(y+)/g, function (v) {
        return date.getFullYear().toString().slice(-v.length)
    });
}

const stringToDate = function date2str(string, format) {
    let second = Number.parseInt(string.substr(format.indexOf("ss"), 2));
    let minute = Number.parseInt(string.substr(format.indexOf("mm"), 2));
    let hour = Number.parseInt(string.substr(format.indexOf("hh"), 2));
    let day = Number.parseInt(string.substr(format.indexOf("dd"), 4));
    let month = Number.parseInt(string.substr(format.indexOf("MM"), 2));
    let year = Number.parseInt(string.substr(format.indexOf("yyyy"), 4));

    return new Date(year, (month - 1), day, hour, minute, second);
}

const sleep = async function (seconds) {
    let ms = seconds * 1000;
    await new Promise(resolve => setTimeout(() => resolve(), ms));
};

/**
 * Recebe uma função async sem parâmetros e tenta executar até um número máximo de tentativas
 * @param operation_name nome da operação para logs
 * @param operation: async () => Any função async a ser executada
 * @param num_retries quantas vezes tentar (default 2)
 * @param delay intervalo entre tentativas em segundos (default 1s)
 * @returns {Promise<*>}
 */
async function retryAsyncFunction(operation_name, operation, num_retries = 2, delay = 1) {
    let retries = 1;
    while (retries <= num_retries) {
        try {
            return await operation();
        } catch (error) {
            console.log("%s: %s(retry %d): Error: %O", new Date, operation_name, retries, error);
            retries++;
            await sleep(delay);
        }
    }
}


const padRight = function (val, size, str) {
    let strPad = ""
    for (let i = 0; i < size; i++) {
        strPad += str;
    }

    return (val + strPad).substr(0, size);
}

const padLeft = function (val, size, str) {
    let strPad = ""
    for (let i = 0; i < size; i++) {
        strPad += str;
    }

    return (strPad + val).substr((strPad + val).length - size, size);
}

const sortJSON = function (data, key, way) {
    return data.sort(function (a, b) {
        var x = a[key];
        var y = b[key];
        if (way === 'asc') {
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        }
        if (way === 'desc') {
            return ((x > y) ? -1 : ((x < y) ? 1 : 0));
        }
    });
}

const replaceAll = function (str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
}

const replaceAccent = function (str) {
    str = str.toLowerCase();
    let listAccent = [
        ["á", "a"],
        ["à", "a"],
        ["â", "a"],
        ["ä", "a"],
        ["ã", "a"],
        ["é", "e"],
        ["è", "e"],
        ["ê", "e"],
        ["ë", "e"],
        ["í", "i"],
        ["ì", "i"],
        ["î", "i"],
        ["ï", "i"],
        ["ó", "o"],
        ["ò", "o"],
        ["ô", "o"],
        ["ö", "o"],
        ["õ", "o"],
        ["ú", "u"],
        ["ù", "u"],
        ["û", "u"],
        ["ü", "u"],
        ["ç", "c"]
    ]
    for (let i = 0; i < listAccent.length; i++) {
        let item = listAccent[i];
        str = replaceAll(str, item[0], item[1]);
    }

    return str;
}

const removeSpecialCharacters = function (str) {
    return str.replace(/[^\w\s]/gi, '');
}

const killContainer = function () {
    process.on('SIGINT', () => {
        process.exit(0);
    })
}

function isEmptyObject(obj) {
  for (let prop in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, prop)) return false;
  }
  return true;
}

const isHasOwnProperty = (o, i) => {
  return !isEmptyObject(o) && Object.prototype.hasOwnProperty.call(o, i);
};

function sessionGenerator(maxLen) {
    const now = new Date().toISOString();
    const randomValue = Math.random().toString();
    const dataToHash = now + randomValue;
    return crypto.createHash('sha3-256').update(dataToHash).digest('hex').substring(0, maxLen);
}

function parseLimitCharacter(v, maxLength) {
  return v.length > maxLength ? v.slice(0, maxLength) : v;
}

function separarBlocos(texto, index = 0, blocos = [], firstCall = true) {
  const regex = /\[(?:block|bloco)(?:\s+delay=([\d.]+))?\]/g;

  // Adiciona o texto antes do primeiro bloco na primeira chamada.
  if (firstCall) {
    const firstMatchIndex = texto.search(regex);

    // Se a busca não encontrar blocos, adiciona o texto inteiro como um bloco sem delay.
    if (firstMatchIndex === -1) {
      return [
        {
          bloco: texto,
          delay: null
        }
      ];
    }

    if (firstMatchIndex > 0) {
      blocos.push({
        bloco: texto.slice(0, firstMatchIndex),
        delay: null
      });
    }
  }

  // Define a posição inicial para a busca regex.
  regex.lastIndex = index;

  const match = regex.exec(texto);
  if (match === null) {
    return blocos;
  }

  const inicio = match.index + match[0].length;
  const delay = match[1] ? parseFloat(match[1]) : null;
  const proximoMatch = regex.exec(texto);
  const fim = proximoMatch ? proximoMatch.index : texto.length;

  // Adiciona o bloco e o valor de delay (se disponível) à lista de blocos.
  blocos.push({
    bloco: texto.slice(inicio, fim),
    delay: delay
  });

  return separarBlocos(texto, fim, blocos, false);
};

module.exports = {
    padRight,
    padLeft,
    sortJSON,
    replaceAll,
    removeSpecialCharacters,
    replaceAccent,
    dateAddMinute,
    dateAddDays,
    firstDayMonth,
    lastDayMonth,
    dateToString,
    stringToDate,
    sleep,
    retryAsyncFunction,
    killContainer,
    sessionGenerator,
    parseLimitCharacter,
    separarBlocos,
    isHasOwnProperty
};