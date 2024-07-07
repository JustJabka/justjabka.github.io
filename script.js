// validate pack_format
function validatePackFormat(packFormat) {
  if (packFormat.includes(',')) {
    const formats = packFormat.split(',').map(format => format.trim());
    for (const format of formats) {
      if (isNaN(format) || format === '') {
        return 'Error: Invalid format. Ensure all values are numbers and separated by commas.';
      }
    }
  } else if (packFormat.includes('-')) {
    const [minFormat, maxFormat] = packFormat.split('-').map(format => format.trim());
    if (isNaN(minFormat) || isNaN(maxFormat) || minFormat === '' || maxFormat === '') {
      return 'Error: Invalid format. Ensure both values are numbers and separated by a hyphen.';
    }
    if (parseInt(minFormat) > parseInt(maxFormat)) {
      return 'Error: Invalid range. The first number should be less than or equal to the second number.';
    }
  } else {
    if (isNaN(packFormat) || packFormat === '') {
      return 'Error: Invalid format. Ensure the value is a number.';
    }
  }
  return '';
}

// generate pack.mcmeta
function generatePackMcmeta(packFormat, description) {
  let packMcmeta = '';

  if (packFormat.includes(',')) {
    const formats = packFormat.split(',').map(format => format.trim());
    packMcmeta = `{
  "pack": {
    "pack_format": ${formats[0]},
    "supported_formats": [
      ${formats.join(', ')}
    ],
    "description": "${description}"
  }
}`;
  } else if (packFormat.includes('-')) {
    const [minFormat, maxFormat] = packFormat.split('-').map(format => format.trim());
    packMcmeta = `{
  "pack": {
    "pack_format": ${minFormat},
    "supported_formats": {
        "min_inclusive": ${minFormat},
        "max_inclusive": ${maxFormat}
    },
    "description": "${description}"
  }
}`;
  } else {
    packMcmeta = `{
  "pack": {
    "pack_format": ${packFormat},
    "description": "${description}"
  }
}`;
  }

  return packMcmeta;
}

// Datapack
function createDatapack() {
  const datapackName = document.getElementById('datapack_name').value;
  const packFormat = document.getElementById('pack_format_dp').value;
  let description = document.getElementById('description_dp').value;
  const datapackFolder = document.getElementById('datapack_folder').value;

  if (!datapackName || !packFormat || !datapackFolder) {
    showMessage('All fields must be filled in!', 'error', 'message_dp', 'generate_dp');
    return;
  }

  const validationMessage = validatePackFormat(packFormat);
  if (validationMessage) {
    showMessage(validationMessage, 'error', 'message_dp', 'generate_dp');
    return;
  }

  if (!description) {
    description = "";
  }

  const packMcmeta = generatePackMcmeta(packFormat, description);

  const loadJson = `{
  "values": [
    "${datapackFolder}:load"
  ]
}`;

  const tickJson = `{
  "values": [
    "${datapackFolder}:tick"
  ]
}`;

  const zip = new JSZip();
  zip.file("pack.mcmeta", packMcmeta);
  const dataFolder = zip.folder("data").folder(datapackFolder);
  dataFolder.folder("function").file("load.mcfunction", "");
  dataFolder.folder("function").file("tick.mcfunction", "");

  const minecraftFolder = zip.folder("data").folder("minecraft").folder("tags").folder("function");
  minecraftFolder.file("load.json", loadJson);
  minecraftFolder.file("tick.json", tickJson);

  zip.generateAsync({ type: "blob" })
    .then(function (content) {
      saveAs(content, `${datapackName}.zip`);
      showMessage('Successfully generated!', 'success', 'message_dp', 'generate_dp');
    })
    .catch(function (error) {
      showMessage('Error generating template', 'error', 'message_dp', 'generate_dp');
    });
}

// Resourcepack
function createResourcepack() {
  const resourcepackName = document.getElementById('resourcepack_name').value;
  const packFormat = document.getElementById('pack_format_rp').value;
  let description = document.getElementById('description_rp').value;
  const resourcepackFolder = document.getElementById('resourcepack_folder').value;

  if (!resourcepackName || !packFormat || !resourcepackFolder) {
    showMessage('All fields must be filled in!', 'error', 'message_rp', 'generate_rp');
    return;
  }

  const validationMessage = validatePackFormat(packFormat);
  if (validationMessage) {
    showMessage(validationMessage, 'error', 'message_rp', 'generate_rp');
    return;
  }

  if (!description) {
    description = "";
  }

  const packMcmeta = generatePackMcmeta(packFormat, description);

  const zip = new JSZip();
  zip.file("pack.mcmeta", packMcmeta);
  const assetsFolder = zip.folder("assets").folder(resourcepackFolder);
  assetsFolder.folder("models").folder("item")
  assetsFolder.folder("textures").folder("item")

  const minecraftFolder = zip.folder("assets").folder("minecraft");
  minecraftFolder.folder("models").folder("item");
  const minecraftLang = minecraftFolder.folder("lang");
  minecraftLang.file("en_us.json", "{}")
  minecraftLang.file("ru_ru.json", "{}")
  minecraftLang.file("uk_ua.json", "{}")

  zip.generateAsync({ type: "blob" })
    .then(function (content) {
      saveAs(content, `${resourcepackName}.zip`);
      showMessage('Successfully generated!', 'success', 'message_rp', 'generate_rp');
    })
    .catch(function (error) {
      showMessage('Error generating template', 'error', 'message_rp', 'generate_rp');
    });
}

function showMessage(message, type, elementId, buttonId) {
  const messageDiv = document.getElementById(elementId);
  const button = document.getElementById(buttonId);

  messageDiv.textContent = message;
  messageDiv.className = `message ${type}`;
  messageDiv.style.display = 'block';
  button.style.display = 'none';

  setTimeout(function () {
    messageDiv.style.display = 'none';
    button.style.display = 'block';
  }, 750);
}

const pack_formats_dp = [
  "48",
  "45-48",
  "25,35,48"
];

const pack_formats_rp = [
  "34",
  "25-34",
  "15,22,34"
];

let index = 0;

function changePlaceholder() {
  const input = document.getElementById('pack_format_dp');
  input.placeholder = pack_formats_dp[index];
  index = (index + 1) % pack_formats_dp.length;

  const input2 = document.getElementById('pack_format_rp');
  input2.placeholder = pack_formats_rp[index];
  index = (index + 1) % pack_formats_rp.length;

}

setInterval(changePlaceholder, 1250);
