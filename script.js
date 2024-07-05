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

  if (!description) {
    description = "";
  }

  const packMcmeta = `{
  "pack": {
      "pack_format": ${packFormat},
      "description": "${description}"
  }
}`;

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

  if (!description) {
    description = "";
  }

  const packMcmeta = `{
  "pack": {
      "pack_format": ${packFormat},
      "description": "${description}"
  }
}`;

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
