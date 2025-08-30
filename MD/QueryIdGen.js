import { randomInt as zufallsGanzzahl } from "node:crypto";

const buchstaben = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const zahlen = "1234567890";

(() => {
  let kennung = "";
  const länge = 16;
  for (let i = 0; i < länge; i++) {
    const zufallswahl = zufallsGanzzahl(1, 3);
    if (zufallswahl === 1) {
      kennung += buchstaben.charAt(zufallsGanzzahl(buchstaben.length));
    } else {
      kennung += zahlen.charAt(zufallsGanzzahl(zahlen.length));
    }
  }
  console.log(kennung);
})();
