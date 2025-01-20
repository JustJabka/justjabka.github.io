function validate(packFormat) {
  if (/[^,\d-]/.test(packFormat)) return 'Error: Invalid format. Only numbers, commas, and hyphens are allowed.';
  const formats = packFormat.split(/[,|-]/).map(f => f.trim());
  if (formats.some(f => isNaN(f) || f === '')) return 'Error: Invalid format. Ensure all values are valid numbers.';
  return '';
}

function addSelectorTags(selector, params) {
  if (!selector.includes('[')) {
    return `${selector}[${params}]`;
  }
  return selector.replace(/\[(.*)\]/, (_, existingParams) => `[${existingParams},${params}]`);
}

// Generate pack.mcmeta
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

// Generate template
function generateTemplate(type) {
  const prefix = type === 'DP' ? 'datapack' : type === 'RP' ? 'resourcepack' : 'raycast';
  const name = document.getElementById(`${prefix}Name`)?.value.trim() || '';
  const folder = document.getElementById(`${prefix}Folder`)?.value.trim() || '';
  const description = document.getElementById(`description${type}`)?.value.trim() || '';
  const format = document.getElementById(`parkFormat${type}`)?.value.trim() || '';

  // If not all fields are filled in
  if (type === 'DP' || type === 'RP') {
    if (!name || !format || !folder) {
      showMessage('All fields must be filled in!', 'error', `message${type}`, `generate${type}`);
      return;
    }

    const validationMessage = validate(format);
    if (validationMessage) {
      showMessage(validationMessage, 'error', `message${type}`, `generate${type}`);
      return;
    }

    // Generate zip
    const zip = new JSZip();
    zip.file("pack.mcmeta", generatePackMcmeta(format, description));

    if (type === 'DP') {
      const contentFolder = zip.folder("data").folder(folder);
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
      const contentFolder = zip.folder("assets").folder(folder);
      contentFolder.folder("models/item");
      contentFolder.folder("textures/item");
      zip.folder("assets/minecraft/lang").file("en_us.json", "{}");
    }

    // Generate zip
    zip.generateAsync({ type: "blob" })
      .then(content => {
        saveAs(content, `${name}.zip`);
        showMessage('Successfully generated!', 'success', `message${type}`, `generate${type}`);
      })
      .catch(() => showMessage('Error generating template', 'error', `message${type}`, `generate${type}`));
  } else if (type === 'RC') {
    const rayLength = document.getElementById('rayLength')?.value || '';
    const rayStep = document.getElementById('rayStep')?.value || '';
    const blockTarget = document.getElementById('blockTarget')?.value || '';
    const entityTarget = document.getElementById('entityTarget')?.value || '';

    // If not all fields are filled in
    if (!rayLength || !rayStep || (!blockTarget && !entityTarget)) {
      showMessage('All fields must be filled in!', 'error', `message${type}`, `generate${type}`);
      return;
    }

    // Generate Zip
    const zip = new JSZip();
    const functionsFolder = zip.folder('function');
    const loopCode = [
      `scoreboard players remove #distance main_score 1`,
      `particle minecraft:flame`
    ];

    if (blockTarget && entityTarget) {
      loopCode.push(
        `# Check if the raycast has hit an entity's hitbox and block`,
        `execute if block ~ ~ ~ ${blockTarget} positioned ~-.99 ~-.99 ~-.99 as ${addSelectorTags(entityTarget, 'dx=0,tag=!raycaster')} positioned ~.99 ~.99 ~.99 as @s[dx=0] run return run say ray hit an entity's hitbox and block`
      );
    } else if (blockTarget) {
      loopCode.push(
        `# Check if the raycast has hit a block`,
        `execute if block ~ ~ ~ ${blockTarget} run return run say ray hit a block`
      );
    } else {
      loopCode.push(
        `# Check if the raycast has hit an entity's hitbox`,
        `execute positioned ~-.99 ~-.99 ~-.99 as ${addSelectorTags(entityTarget, 'dx=0,tag=!raycaster')} positioned ~.99 ~.99 ~.99 as @s[dx=0] run return run say ray hit an entity's hitbox`
      );
    }

    loopCode.push(
      `# If the raycast has not hit a target, and the limit has not been reached, move the raycast forward and run the function again`,
      `execute if block ~ ~ ~ #minecraft:replaceable if score #distance main_score matches 1.. positioned ^ ^ ^${rayStep} run function <namespace>:loop`
    );

    functionsFolder.file('load.mcfunction', `scoreboard objectives add main_score dummy`);
    functionsFolder.file('start.mcfunction', [
      `tag @s add raycaster`,
      `scoreboard players set #distance main_score ${rayLength}`,
      `execute at @s anchored eyes positioned ^ ^ ^${rayStep} run function <namespace>:loop`,
      `tag @s remove raycaster`
    ].join('\n'));
    functionsFolder.file('loop.mcfunction', loopCode.join('\n'));

    zip.generateAsync({ type: "blob" })
      .then(content => {
        saveAs(content, `Raycast Template.zip`);
        showMessage('Successfully generated!', 'success', `message${type}`, `generate${type}`);
      })
      .catch(() => showMessage('Error generating template', 'error', `message${type}`, `generate${type}`));
  }
}

// Show error message
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

let placeholdersDP = ["Loading..."];
let placeholdersRP = ["Loading..."];

// Get latest pack format
fetch("https://raw.githubusercontent.com/misode/mcmeta/summary/versions/data.min.json").then(res => res.json()).then(data => {
  const { data_pack_version: lastReleaseDP, resource_pack_version: lastReleaseRP } = data.find(el => el.type === "release")
  const { data_pack_version: lastSnapshotDP, resource_pack_version: lastSnapshotRP } = data.find(el => el.type === "snapshot")
  placeholdersDP = [`${lastReleaseDP}`, `${lastReleaseDP - 1}-${lastReleaseDP}`, `${lastSnapshotDP - 2},${lastSnapshotDP - 1},${lastSnapshotDP}`]
  placeholdersRP = [`${lastReleaseRP}`, `${lastReleaseRP - 1}-${lastReleaseRP}`, `${lastSnapshotRP - 2},${lastSnapshotRP - 1},${lastSnapshotRP}`]
})

let index = 0;

// Placeholder loop
function changePlaceholder() {
  const inputDP = document.getElementById('parkFormatDP');
  inputDP.placeholder = placeholdersDP[index];
  index = (index + 1) % placeholdersDP.length;

  const inputRP = document.getElementById('parkFormatRP');
  inputRP.placeholder = placeholdersRP[index];
  index = (index + 1) % placeholdersRP.length;
}

setInterval(changePlaceholder, 1250);