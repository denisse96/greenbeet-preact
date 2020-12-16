import { Component } from 'preact';
import { useState } from 'preact/hooks';
import Axios from 'axios';
import { useQuery } from 'react-query';
import { openPopupWidget } from 'react-calendly';
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
	const userdata = await Axios.post(`https://greenbeet.vercel.app/api/user/${id}`);
	return userdata.data;
};

const styles = {
	greenBackground: { backgroundColor: '#136966', color: 'white', fontStyle: 'normal', fontWeight: 'normal' },
	button: { backgroundColor: '#a8f800', fontSize: '0.9em', textTransform: 'uppercase' },
	label: { fontStyle: 'normal', fontWeight: 'normal' }
};

const Header = ({ userId = '' }) => {
	const calendlyClick = (url) => openPopupWidget({ url });
	const [ nutricion, setNutricion ] = useState('');
	const [ entrenamiento, setEntrenamiento ] = useState('');
	let id = userId || (window.ShopifyAnalytics && window.ShopifyAnalytics.meta.page.customerId);

	const { data = {}, isSuccess } = useQuery(
		[
			'user.data',
			{
				id: id
			}
		],
		getUserData
	);

	if (!id) {
		return '';
	}
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
					<div class="row">
						<div style={styles.greenBackground} class="card col-sm-3 shadowed">
							<div class="section double-padded">
								<h4 style={{ color: 'white', textTransform: 'none' }}>Entrenamiento personal</h4>
							</div>
							<div class="section double-padded">
								<div class="flex flex-column">
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
										onClick={() => calendlyClick(entrenamiento)}
										disabled={!entrenamiento}
									>
										Agendar cita
									</button>
								</div>
							</div>
						</div>
						<div style={styles.greenBackground} class="card col-sm-3 shadowed">
							<div class="section double-padded">
								<h4 style={{ color: 'white', textTransform: 'none' }}>Consulta de nutrición</h4>
							</div>
							<div class="section double-padded">
								<div class="flex flex-column">
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
										onClick={() => calendlyClick(nutricion)}
										disabled={!nutricion}
										class="rounded align-self-start"
									>
										Agendar cita
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
