function createUpButton() {

  let button = document.createElement('button');
  button.setAttribute('class', 'up-button');
  button.innerText = "up"
  this.document.body.appendChild(button);

  let but = this.document.getElementsByClassName('up-button')[0];
  but.addEventListener('click', () => {
    window.scrollTo(0, 0);
  });
}

createUpButton();
