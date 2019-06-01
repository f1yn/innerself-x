import { element } from '../../x';

export default element('button', (button) => {
	button.innerHTML = 'I\'m a fancy button';
	button.addEventListener('click', () => {
		button.innerHTML += ' Hello!';
	});
});