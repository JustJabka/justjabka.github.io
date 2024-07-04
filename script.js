function createDatapack() {
  const datapackName = document.getElementById('datapack_name').value;
  const packFormat = document.getElementById('pack_format').value;
  let description = document.getElementById('description').value;
  const datapackFolder = document.getElementById('datapack_folder').value;

  if (!datapackName || !packFormat || !datapackFolder) {
    alert('All fields must be filled in!');
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
      alert('Datapack template successfully generated!');
    });
}