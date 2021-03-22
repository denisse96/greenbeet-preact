import { Component } from "preact";
import { useState, useEffect } from "preact/hooks";
import Axios from "axios";
import { useQuery } from "react-query";
import { openPopupWidget } from "react-calendly";

// perfectly splendid!
export default class App extends Component {
	render(props) {
		return <Header {...props} />;
	}
}

const getUserData = async (_, { id }) => {
	const url = `https://greenbeet.vercel.app/api/user/${id}`;
	const userdata = await Axios.get(url);
	return userdata.data;
};

/**
 * Método que obtiene los links de AirTable según el usuario y el tipo de evento solicitados.
 * @param {object} data
 * @param {string} data.id
 * @param {string} data.event
 * @param {string} data.event_type
 */
const updateUserLinks = async ({ id, event, event_type }) => {
	const url = `https://greenbeet.vercel.app/api/user/eventScheduled`;
	const data = {
		userShopifyId: String(id),
		event,
		event_type,
	};

	await Axios.post(url, data);
};

function isCalendlyEvent(e) {
	return e.data.event && e.data.event.indexOf("calendly") === 0;
}

const styles = {
	greenBackground: {
		backgroundColor: "#136966",
		color: "white",
		fontStyle: "normal",
		fontWeight: "normal",
	},
	button: { backgroundColor: "#a8f800", fontSize: "0.9em" },
	label: { fontStyle: "normal", fontWeight: "normal" },
};

const appointmentsEnums = {
	nutricion: {
		online: "nutricion-online",
		domicilio: "nutricion-domicilio ",
		presencial: "nutricion-presencial",
	},
	entrenamiento: {
		online: "entrenamiento-online",
		domicilio: "entrenamiento-domicilio",
		presencial: "entrenamiento-presencial",
	},
};

const Header = ({ userId = "" }) => {
	const calendlyClick = (url) => openPopupWidget({ url });
	const tabOpen = (url) => window.open(url, "_blank");
	const [selectedOption, setSelectedOption] = useState("");
	let id =
		userId ||
		(window.ShopifyAnalytics && window.ShopifyAnalytics.meta.page.customerId);
	let collection_title = window.collection_title || "entrenamiento";

	let build_mode = "entrenamiento";

	// Ugly stuff. Obtener el tipo de evento según el nombre de la colección.
	if (
		collection_title
			.toLowerCase()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.includes("nutri")
	) {
		build_mode = "nutricion";
	}

	const { data = {}, refetch, isLoading } = useQuery(
		[
			"user.data",
			{
				id: id,
			},
		],
		getUserData
	);

	const { urls = [] } = data;

	const radioUrls = {
		entrenamiento: {
			online: { url: "", sesiones: 0 },
			domicilio: { url: "", sesiones: 0 },
		},
		nutricion: {
			online: { url: "", sesiones: 0 },
			presencial: { url: "", sesiones: 0 },
			domicilio: { url: "", sesiones: 0 },
		},
	};

	// Obtener los links del usuario según el tipo de sesión. Esto construye un megaobjeto dentro de `radioUrls`.
	urls.forEach((urlObject) => {
		if (
			urlObject.sesiones_restantes_entrenamiento > 0 &&
			urlObject.localizacion
		) {
			const links = urlObject.url.split(", ");
			radioUrls.entrenamiento[urlObject.localizacion].url = links[0];
			radioUrls.entrenamiento[urlObject.localizacion].sesiones +=
				urlObject.sesiones_restantes_entrenamiento;
		}
		if (urlObject.sesiones_restantes_nutricion > 0 && urlObject.localizacion) {
			const links = urlObject.url.split(", ");
			radioUrls.nutricion[urlObject.localizacion].url = links[0];
			radioUrls.nutricion[urlObject.localizacion].sesiones +=
				urlObject.sesiones_restantes_nutricion;
		}
	});

	let url = "";

	// More ugly stuff. Obtener los links según la opción seleccionada.
	if (build_mode === "nutricion") {
		if (selectedOption === appointmentsEnums.nutricion.online) {
			url = radioUrls.nutricion.online.url;
		} else if (selectedOption === appointmentsEnums.nutricion.presencial) {
			url = radioUrls.nutricion.presencial.url;
		} else if (selectedOption === appointmentsEnums.nutricion.domicilio) {
			url = radioUrls.nutricion.domicilio.url;
		}
	} else {
		if (selectedOption === appointmentsEnums.entrenamiento.online) {
			url = radioUrls.entrenamiento.online.url;
		} else if (selectedOption === appointmentsEnums.entrenamiento.presencial) {
			url = radioUrls.entrenamiento.presencial.url;
		} else if (selectedOption === appointmentsEnums.entrenamiento.domicilio) {
			url = radioUrls.entrenamiento.domicilio.url;
		}
	}

	let hasSelectedUrl = !!url;

	// Actualizar los datos si se hace la compra de un producto.
	useEffect(() => {
		const host = window.location.origin || "";

		function handleMessage(event) {
			if (event.origin !== host || !userId) return;
			if (event.data === "refetch") refetch();
		}

		const bc = new BroadcastChannel("refetch_channel");
		bc.onmessage = handleMessage;
		bc.postMessage("refetch");

		return () => {
			bc.close();
		};
	}, []);

	// Listener que responde al evento de calendly disparado cuando un usuario 
	// crea un appointment
	useEffect(() => {
		async function handleCalendlyMessage(e) {
			if (isCalendlyEvent(e)) {
				const { event, payload } = e.data;
				if (event !== "calendly.event_scheduled") return;

				await updateUserLinks({
					event: url,
					event_type: build_mode,
					id: String(id),
				});
				await refetch();
			}
		}


		window.addEventListener("message", handleCalendlyMessage);

		return () => {
			window.removeEventListener("message", handleCalendlyMessage);
		};
	}, [url]);

	return (
		<div>
			<div>
				<div>
					<div class="row justify-center">
						<div
							style={styles.greenBackground}
							class="card col-sm-12 col-md-3 shadowed"
						>
							<div class="section double-padded">
								<h4 class="card-header">
									{build_mode === "entrenamiento"
										? "ENTRENAMIENTO PERSONAL"
										: "CONSULTA DE NUTRICIÓN"}
								</h4>
							</div>
							{isLoading ? (
								<Loader />
							) : (
								<>
									{build_mode === "entrenamiento" ? (
										<>
											<div class="section double-padded">
												<div class="flex flex-column">
													<div class="bottom-double-padded">
														<div class="flex align-center">
															<input
																onClick={() =>
																	setSelectedOption(
																		appointmentsEnums.entrenamiento.online
																	)
																}
																checked={
																	selectedOption ===
																	appointmentsEnums.entrenamiento.online
																}
																name="tipo"
																type="radio"
																id="online-entrenamiento"
																autocomplete="off"
															/>
															<label
																class="card-label"
																style={styles.label}
																for="online-entrenamiento"
															>
																Online{" "}
																{radioUrls.entrenamiento["online"].sesiones}{" "}
																disponibles
															</label>
														</div>
														<div class="flex align-center">
															<input
																name="tipo"
																type="radio"
																id="domicilio-entrenamiento"
																autocomplete="off"
																onClick={() =>
																	setSelectedOption(
																		appointmentsEnums.entrenamiento.domicilio
																	)
																}
																checked={
																	selectedOption ===
																	appointmentsEnums.entrenamiento.domicilio
																}
															/>
															<label
																class="card-label"
																style={styles.label}
																for="domicilio-entrenamiento"
															>
																Domicilio{" "}
																{radioUrls.entrenamiento["domicilio"].sesiones}{" "}
																disponibles
															</label>
														</div>
													</div>
													<button
														class="rounded align-self-start"
														style={styles.button}
														onClick={() => {
															hasSelectedUrl
																? calendlyClick(url)
																: tabOpen(
																		"https://greenbeet.mx/collections/entrenamiento-personal/products/entrenamiento-personal-domicilio"
																  );
														}}
													>
														{hasSelectedUrl ? (
															"Agendar Cita"
														) : (
															<div>
																COMPRAR SESIÓN
																<br />
																DE ENTRENAMIENTO
															</div>
														)}
													</button>
												</div>
											</div>
										</>
									) : (
										<>
											<div class="section double-padded">
												<div class="flex flex-column">
													<div class="bottom-double-padded">
														<div class="flex align-center">
															<input
																onClick={() =>
																	setSelectedOption(
																		appointmentsEnums.nutricion.online
																	)
																}
																checked={
																	selectedOption ===
																	appointmentsEnums.nutricion.online
																}
																name="nutricion"
																type="radio"
																id="online-nutricion"
																autocomplete="off"
															/>
															<label
																class="card-label"
																style={styles.label}
																for="online-nutricion"
															>
																Online {radioUrls.nutricion["online"].sesiones}{" "}
																disponibles
															</label>
														</div>
														<div class="flex align-center">
															<input
																onClick={() =>
																	setSelectedOption(
																		appointmentsEnums.nutricion.presencial
																	)
																}
																checked={
																	selectedOption ===
																	appointmentsEnums.nutricion.presencial
																}
																name="nutricion"
																type="radio"
																id="presencial-nutricion"
																autocomplete="off"
															/>
															<label
																class="card-label"
																style={styles.label}
																for="presencial-nutricion"
															>
																Presencial{" "}
																{radioUrls.nutricion["presencial"].sesiones}{" "}
																disponibles
															</label>
														</div>
														<div class="flex align-center">
															<input
																onClick={() =>
																	setSelectedOption(
																		appointmentsEnums.nutricion.domicilio
																	)
																}
																checked={
																	selectedOption ===
																	appointmentsEnums.nutricion.domicilio
																}
																name="nutricion"
																type="radio"
																id="domicilio-nutricion"
																autocomplete="off"
															/>
															<label
																class="card-label"
																style={styles.label}
																for="domicilio-nutricion"
															>
																Domicilio{" "}
																{radioUrls.nutricion["domicilio"].sesiones}{" "}
																disponibles
															</label>
														</div>
													</div>
													<button
														style={styles.button}
														onClick={() => {
															hasSelectedUrl
																? calendlyClick(url)
																: tabOpen(
																		"https://greenbeet.mx/collections/nutricion/products/consulta-de-nutricion-1ra-vez"
																  );
														}}
														class="rounded align-self-start"
													>
														{hasSelectedUrl ? (
															"AGENDAR CITA"
														) : (
															<div>
																COMPRAR SESIÓN
																<br />
																DE NUTRICIÓN
															</div>
														)}
													</button>
												</div>
											</div>
										</>
									)}
								</>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

const Loader = () => (
	<div class="lds-ring">
		<div></div>
		<div></div>
		<div></div>
		<div></div>
	</div>
);
