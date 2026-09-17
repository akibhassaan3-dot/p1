(function () {
  'use strict';

  const USERNAME = 'Shafiqul100';
  const AMOUNT = '125.00';

  function walkAndReplace() {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    let changed = false;

    while ((node = walker.nextNode())) {
      let t = node.nodeValue;

      if (!t) continue;

      // User ID
      if (/User\s*ID\s*:/i.test(t)) {
        node.nodeValue = 'User ID: ' + USERNAME;
        changed = true;
      }

      // Amount (pure 0.00, Tk 0.00, space সহ)
      if (/\b0\.00\b/.test(t)) {
        node.nodeValue = t.replace(/\b0\.00\b/g, AMOUNT);
        changed = true;
      }

      // In words
      if (/Zero\s+Only/i.test(t)) {
        node.nodeValue = 'Taka One hundred and twenty-five Only';
        changed = true;
      }
    }

    if (changed) {
      console.log('✅ CNF print amount + user fixed');
    }
  }

  // page late render হয় → retry
  let count = 0;
  const interval = setInterval(() => {
    walkAndReplace();
    count++;
    if (count >= 10) clearInterval(interval);
  }, 500);

})();
