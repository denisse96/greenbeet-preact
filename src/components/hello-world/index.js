import { Component } from 'preact';
import { useState } from 'preact/hooks';
import Axios from 'axios';
import { useQuery } from 'react-query';
import { openPopupWidget } from 'react-calendly';

// perfectly splendid!
export default class App extends Component {
	render(props) {
		return <Header {...props} />;
	}
}

window.addEventListener(
	'message',
	(event) => {
		// Do we trust the sender of this message?  (might be
		// different from what we originally opened, for example).
		//	if (event.origin !== 'www.greebe') return;
		console.log(event.data);
		//setComprado(event.data);

		// event.source is popup
		// event.data is "hi there yourself!  the secret response is: rheeeeet!"
	},
	false
);

const getUserData = async (_, { id }) => {
	const url =
		process.env.NODE_ENV === 'production'
			? `https://greenbeet.vercel.app/api/user/${id}`
			: `http://localhost:8000/api/user/${id}`;
	const userdata = await Axios.post(url);
	return userdata.data;
};

const styles = {
	greenBackground: { backgroundColor: '#136966', color: 'white', fontStyle: 'normal', fontWeight: 'normal' },
	button: { backgroundColor: '#a8f800', fontSize: '0.9em' },
	label: { fontStyle: 'normal', fontWeight: 'normal' }
};

const Header = ({ userId = '' }) => {
	const calendlyClick = (url) => openPopupWidget({ url });
	const tabOpen = (url) => window.open(url, '_blank');
	const [ nutricion, setNutricion ] = useState('');
	const [ entrenamiento, setEntrenamiento ] = useState('');
	console.log(userId);

	const { data = {}, isSuccess } = useQuery(
		[
			'user.data',
			{
				id: userId
			}
		],
		getUserData
	);

	//if (!userId) {
	//	return '';
	//}
	const { urls = [] } = data;

	const radioUrls = {
		entrenamiento: {
			online: '',
			presencial: '',
			domicilio: ''
		},
		nutricion: {
			online: '',
			presencial: '',
			domicilio: ''
		}
	};

	const [ creditos_entrenamiento, creditos_nutricion ] = urls.reduce(
		(acc, curr) => [ acc + curr.sesiones_restantes_entrenamiento, acc + curr.sesiones_restantes_nutricion ],
		[ 0, 0 ]
	);

	urls.forEach((urlObject) => {
		if (
			urlObject.sesiones_restantes_entrenamiento > 0 &&
			urlObject.localizacion &&
			!radioUrls.entrenamiento[urlObject.localizacion]
		) {
			radioUrls.entrenamiento[urlObject.localizacion] = urlObject.url;
		}
		if (
			urlObject.sesiones_restantes_nutricion > 0 &&
			urlObject.localizacion &&
			!radioUrls.nutricion[urlObject.localizacion]
		) {
			radioUrls.nutricion[urlObject.localizacion] = urlObject.url;
		}
	});
	return (
		<div>
			<div>
				<div>
					<div class="row justify-center">
						<div style={styles.greenBackground} class="card col-sm-3 shadowed">
							<div class="section double-padded">
								<h4 style={{ color: 'white', textTransform: 'none' }}>ENTRENAMIENTO PERSONAL</h4>
							</div>
							<div class="section double-padded">
								<div class="flex flex-column">
									{userId && <h2>{creditos_entrenamiento} disponibles</h2>}
									<div class="bottom-double-padded">
										<div class="flex align-center">
											<input
												onClick={() => setEntrenamiento(radioUrls.entrenamiento.online)}
												name="tipo"
												type="radio"
												id="online-entrenamiento"
												autocomplete="off"
											/>
											<label class="card-label" style={styles.label} for="online-entrenamiento">
												Online
											</label>
										</div>
										<div class="flex align-center">
											<input
												onClick={() => setEntrenamiento(radioUrls.entrenamiento.presencial)}
												name="tipo"
												type="radio"
												id="presencial-entrenamiento"
												autocomplete="off"
											/>
											<label
												class="card-label"
												style={styles.label}
												for="presencial-entrenamiento"
											>
												Presencial
											</label>
										</div>
										<div class="flex align-center">
											<input
												name="tipo"
												type="radio"
												id="domicilio-entrenamiento"
												autocomplete="off"
												onClick={() => setEntrenamiento(radioUrls.entrenamiento.domicilio)}
											/>
											<label
												class="card-label"
												style={styles.label}
												for="domicilio-entrenamiento"
											>
												Domicilio
											</label>
										</div>
									</div>
									<button
										class="rounded align-self-start"
										style={styles.button}
										onClick={() => {
											entrenamiento
												? calendlyClick(entrenamiento)
												: tabOpen('https://greenbeet.mx/collections');
										}}
									>
										{entrenamiento ? (
											'Agendar Cita'
										) : (
											<div>
												COMPRAR SESIÓN<br />DE ENTRENAMIENTO
											</div>
										)}
									</button>
								</div>
							</div>
						</div>
						<div style={styles.greenBackground} class="card col-sm-3 shadowed">
							<div class="section double-padded">
								<h4 style={{ color: 'white', textTransform: 'none' }}>CONSULTA DE NUTRICIÓN</h4>
							</div>
							<div class="section double-padded">
								<div class="flex flex-column">
									{userId && <h2>{creditos_nutricion} disponibles</h2>}
									<div class="bottom-double-padded">
										<div class="flex align-center">
											<input
												onClick={() => setNutricion(radioUrls.nutricion.online)}
												name="nutricion"
												type="radio"
												id="online-nutricion"
												autocomplete="off"
											/>
											<label class="card-label" style={styles.label} for="online-nutricion">
												Online
											</label>
										</div>
										<div class="flex align-center">
											<input
												onClick={() => setNutricion(radioUrls.nutricion.presencial)}
												name="nutricion"
												type="radio"
												id="presencial-nutricion"
												autocomplete="off"
											/>
											<label class="card-label" style={styles.label} for="presencial-nutricion">
												Presencial
											</label>
										</div>
										<div class="flex align-center">
											<input
												onClick={() => setNutricion(radioUrls.nutricion.domicilio)}
												name="nutricion"
												type="radio"
												id="domicilio-nutricion"
												autocomplete="off"
											/>
											<label class="card-label" style={styles.label} for="domicilio-nutricion">
												Domicilio
											</label>
										</div>
									</div>
									<button
										style={styles.button}
										onClick={() => {
											nutricion
												? calendlyClick(nutricion)
												: tabOpen('https://greenbeet.mx/collections');
										}}
										class="rounded align-self-start"
									>
										{nutricion ? (
											'AGENDAR CITA'
										) : (
											<div>
												COMPRAR SESIÓN<br />DE NUTRICIÓN
											</div>
										)}
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
