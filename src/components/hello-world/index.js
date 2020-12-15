import { Component } from 'preact';
import { useState } from 'preact/hooks';
import Axios from 'axios';
import { useQuery } from 'react-query';
import 'mini.css/dist/mini-default.css';
import './style.scss';
import { openPopupWidget } from 'react-calendly';

export default class App extends Component {
	render(props) {
		return <Header {...props} />;
	}
}

const getUserData = async (_, { id }) => {
	const userdata = await Axios.post(`https://greenbeet.vercel.app/api/user/${id}`);
	return userdata.data;
};

const Header = ({ userId = '' }) => {
	const calendlyClick = (url) => openPopupWidget({ url });
	const [ nutricion, setNutricion ] = useState('');
	const [ entrenamiento, setEntrenamiento ] = useState('');
	const { data = {}, isSuccess } = useQuery(
		[
			'user.data',
			{
				id: userId
			}
		],
		getUserData
	);

	if (!userId) {
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
			<div class="container">
				<div className="row">
					<div class="card col-sm-3 shadowed">
						<div class="section double-padded" style={{ backgroundColor: 'rgb(242, 242, 242)' }}>
							Entrenamiento personal
						</div>
						<div class="section row" style={{ backgroundColor: 'rgb(242, 242, 242)' }}>
							<div class="inline-flex rounded-md">
								<div style={{ paddingBottom: '0.5em' }}>
									<div class="col-sm-12 col-md" style={{ display: 'flex', alignItems: 'center' }}>
										<input
											onClick={() => setEntrenamiento(radioUrls.entrenamiento.online)}
											name="tipo"
											type="radio"
											id="online-entrenamiento"
											autocomplete="off"
											class="doc"
										/>
										<label for="online-entrenamiento">Online</label>
									</div>
									<div class="col-sm-12 col-md" style={{ display: 'flex', alignItems: 'center' }}>
										<input
											onClick={() => setEntrenamiento(radioUrls.entrenamiento.presencial)}
											name="tipo"
											type="radio"
											id="presencial-entrenamiento"
											autocomplete="off"
											class="doc"
										/>
										<label for="presencial-entrenamiento">Presencial</label>
									</div>
									<div class="col-sm-12 col-md" style={{ display: 'flex', alignItems: 'center' }}>
										<input
											name="tipo"
											type="radio"
											id="domicilio-entrenamiento"
											autocomplete="off"
											class="doc"
											onClick={() => setEntrenamiento(radioUrls.entrenamiento.domicilio)}
										/>
										<label for="domicilio-entrenamiento">Domicilio</label>
									</div>
								</div>
								<button
									onClick={() => calendlyClick(entrenamiento)}
									class="tertiary"
									style={{ background: 'rgb(0,100,0)' }}
									disabled={!entrenamiento}
								>
									Agendar cita
								</button>
							</div>
						</div>
					</div>
					<div class="card col-sm-3 shadowed">
						<div class="section double-padded" style={{ backgroundColor: 'rgb(242, 242, 242)' }}>
							Consulta de nutrición
						</div>
						<div class="section row" style={{ backgroundColor: 'rgb(242, 242, 242)' }}>
							<div class="inline-flex rounded-md">
								<div style={{ paddingBottom: '0.5em' }}>
									<div class="col-sm-12 col-md" style={{ display: 'flex', alignItems: 'center' }}>
										<input
											onClick={() => setNutricion(radioUrls.nutricion.online)}
											name="nutricion"
											type="radio"
											id="online-nutricion"
											autocomplete="off"
											class="doc"
										/>
										<label for="online-nutricion">Online</label>
									</div>
									<div class="col-sm-12 col-md" style={{ display: 'flex', alignItems: 'center' }}>
										<input
											onClick={() => setNutricion(radioUrls.nutricion.presencial)}
											name="nutricion"
											type="radio"
											id="presencial-nutricion"
											autocomplete="off"
											class="doc"
										/>
										<label for="presencial-nutricion">Presencial</label>
									</div>
									<div class="col-sm-12 col-md" style={{ display: 'flex', alignItems: 'center' }}>
										<input
											onClick={() => setNutricion(radioUrls.nutricion.domicilio)}
											name="nutricion"
											type="radio"
											id="domicilio-nutricion"
											autocomplete="off"
											class="doc"
										/>
										<label for="domicilio-nutricion">Domicilio</label>
									</div>
								</div>
								<button
									onClick={() => calendlyClick(nutricion)}
									class="tertiary"
									style={{ background: 'rgb(0,100,0)' }}
									disabled={!nutricion}
								>
									Agendar cita
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
