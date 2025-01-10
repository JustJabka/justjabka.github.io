function validatePackFormat(packFormat) {
  if (/[^,\d-]/.test(packFormat)) return 'Error: Invalid format. Only numbers, commas, and hyphens are allowed.';
  const formats = packFormat.split(/[,|-]/).map(f => f.trim());
  if (formats.some(f => isNaN(f) || f === '')) return 'Error: Invalid format. Ensure all values are valid numbers.';
  return '';
}

function generatePackMcmeta(packFormat, description) {
  const formats = packFormat.split(',');
  if (formats.length > 1) {
    return `{
  "pack": {
    "pack_format": ${formats[0].trim()},
    "supported_formats": [${formats.join(', ')}],
    "description": "${description}"
  }
}`;
  }
  if (packFormat.includes('-')) {
    const [minFormat, maxFormat] = packFormat.split('-').map(f => f.trim());
    return `{
  "pack": {
    "pack_format": ${minFormat},
    "supported_formats": { "min_inclusive": ${minFormat}, "max_inclusive": ${maxFormat} },
    "description": "${description}"
  }
}`;
  }
  return `{
  "pack": {
    "pack_format": ${packFormat},
    "description": "${description}"
  }
}`;
}

function generateTemplate(type) {
  const prefix = type === 'dp' ? 'datapack' : 'resourcepack';
  const name = document.getElementById(`${prefix}_name`).value;
  const format = document.getElementById(`pack_format_${type}`).value;
  const description = document.getElementById(`description_${type}`).value || '';
  const folder = document.getElementById(`${prefix}_folder`).value;

  if (!name || !format || !folder) {
    showMessage('All fields must be filled in!', 'error', `message_${type}`, `generate_${type}`);
    return;
  }

  const validationMessage = validatePackFormat(format);
  if (validationMessage) {
    showMessage(validationMessage, 'error', `message_${type}`, `generate_${type}`);
    return;
  }

  const zip = new JSZip();
  zip.file("pack.mcmeta", generatePackMcmeta(format, description));

  const contentFolder = zip.folder(type === 'dp' ? "data" : "assets").folder(folder);
  if (type === 'dp') {
    const functionFolderName = format < 45 ? "functions" : "function";
    contentFolder.folder(functionFolderName).file("load.mcfunction", "").file("tick.mcfunction", "");

    const tagsFolderName = format < 45 ? "functions" : "function";
    const mcFolder = zip.folder(`data/minecraft/tags/${tagsFolderName}`);
    mcFolder.file("load.json", `{
  "values": [
    "${folder}:load"
  ]
}`);
    mcFolder.file("tick.json", `{
  "values": [
    "${folder}:tick"
  ]
}`);
  } else {
    contentFolder.folder("models/item");
    contentFolder.folder("textures/item");
    zip.folder("assets/minecraft/lang").file("en_us.json", "{}").file("ru_ru.json", "{}").file("uk_ua.json", "{}");
  }

  zip.generateAsync({ type: "blob" })
    .then(content => {
      saveAs(content, `${name}.zip`);
      showMessage('Successfully generated!', 'success', `message_${type}`, `generate_${type}`);
    })
    .catch(() => showMessage('Error generating template', 'error', `message_${type}`, `generate_${type}`));
}

function showMessage(message, type, elementId, buttonId) {
  const messageDiv = document.getElementById(elementId);
  const button = document.getElementById(buttonId);
  messageDiv.textContent = message;
  messageDiv.className = `message ${type}`;
  messageDiv.style.display = 'block';
  button.style.display = 'none';

  setTimeout(() => {
    messageDiv.style.display = 'none';
    button.style.display = 'block';
  }, 750);
}

const placeholders_dp = ["48","45-48","25,35,48"];
const placeholders_rp = ["34","25-34","15,22,34"];

let index = 0;

function changePlaceholder() {
  const input = document.getElementById('pack_format_dp');
  input.placeholder = placeholders_dp[index];
  index = (index + 1) % placeholders_dp.length;

  const input2 = document.getElementById('pack_format_rp');
  input2.placeholder = placeholders_rp[index];
  index = (index + 1) % placeholders_rp.length;

}

setInterval(changePlaceholder, 1250);
