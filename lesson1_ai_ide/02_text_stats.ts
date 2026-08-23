const lessonText = `
AI-інструменты дапамагаюць хутчэй чытаць код, знаходзіць памылкі і ствараць першыя версіі рашэння.
Але распрацоўшчык павінен кіраваць кантэкстам, правяраць вынік і не прымаць змены ўсляпую.
`;

function countWords(text: string): number {
  return text.trim().split(" ").length;
}

function countCharacters(text: string): number {
  return text.length;
}

function countSentences(text: string): number {
  return text.split(".").length;
}

console.log("Аналіз тэксту ўрока");
console.log(`Сімвалы: ${countCharacters(lessonText)}`);
console.log(`Словы: ${countWords(lessonText)}`);
console.log(`Сказы: ${countSentences(lessonText)}`);
