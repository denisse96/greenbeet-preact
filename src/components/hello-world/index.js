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
  const userdata = await Axios.post(url);
  return userdata.data;
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

const Header = ({ userId = "" }) => {
  const calendlyClick = (url) => openPopupWidget({ url });
  const tabOpen = (url) => window.open(url, "_blank");
  const [nutricion, setNutricion] = useState("");
  const [entrenamiento, setEntrenamiento] = useState("");
  let id =
    userId ||
    (window.ShopifyAnalytics && window.ShopifyAnalytics.meta.page.customerId);
  let collection_title = window.collection_title || "entrenamiento";

  let build_mode = "entrenamiento";

  if (
    collection_title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .includes("nutricion")
  ) {
    build_mode = "nutricion";
  }

  const { data = {}, refetch } = useQuery(
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
  console.log(radioUrls);

  const [creditos_entrenamiento, creditos_nutricion] = urls.reduce(
    (acc, curr) => [
      acc[0] + curr.sesiones_restantes_entrenamiento,
      acc[1] + curr.sesiones_restantes_nutricion,
    ],
    [0, 0]
  );

  urls.forEach((urlObject) => {
    if (
      urlObject.sesiones_restantes_entrenamiento > 0 &&
      urlObject.localizacion //&&
      //	!radioUrls.entrenamiento[urlObject.localizacion]
    ) {
      radioUrls.entrenamiento[urlObject.localizacion].url = urlObject.url;
      radioUrls.entrenamiento[urlObject.localizacion].sesiones +=
        urlObject.sesiones_restantes_entrenamiento;
    }
    if (
      urlObject.sesiones_restantes_nutricion > 0 &&
      urlObject.localizacion // &&
      //!radioUrls.nutricion[urlObject.localizacion]
    ) {
      radioUrls.nutricion[urlObject.localizacion].url = urlObject.url;
      radioUrls.nutricion[urlObject.localizacion].sesiones +=
        urlObject.sesiones_restantes_nutricion;
    }
  });

  useEffect(() => {
    const host = window.location.origin || "";
    function handleCalendlyMessage(e) {
      if (isCalendlyEvent(e)) {
        const { event, payload } = e.data;
        if (event !== "calendly.event_scheduled") return;

        console.log({ payload });
      }
    }

    window.addEventListener("message", handleCalendlyMessage);

    function handleMessage(event) {
      if (event.origin !== host || !userId) return;
      if (event.data === "refetch") refetch();
    }

    const bc = new BroadcastChannel("refetch_channel");
    bc.onmessage = handleMessage;
    bc.postMessage("refetch");

    return () => {
      bc.close();
      window.removeEventListener("message", handleCalendlyMessage);
    };
  }, []);

  return (
    <div>
      <div>
        <div>
          <div class="row justify-center">
            {build_mode === "entrenamiento" ? (
              <div
                style={styles.greenBackground}
                class="card col-sm-12 col-md-3 shadowed"
              >
                <div class="section double-padded">
                  <h4 class="card-header">ENTRENAMIENTO PERSONAL</h4>
                </div>
                <div class="section double-padded">
                  <div class="flex flex-column">
                    <div class="bottom-double-padded">
                      <div class="flex align-center">
                        <input
                          onClick={() =>
                            setEntrenamiento(radioUrls.entrenamiento.online.url)
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
                          Online {radioUrls.entrenamiento["online"].sesiones}{" "}
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
                            setEntrenamiento(
                              radioUrls.entrenamiento.domicilio.url
                            )
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
                        entrenamiento
                          ? calendlyClick(entrenamiento)
                          : tabOpen("https://greenbeet.mx/collections");
                      }}
                    >
                      {entrenamiento ? (
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
              </div>
            ) : (
              <div
                style={styles.greenBackground}
                class="card col-sm-12 col-md-3 shadowed"
              >
                <div class="section double-padded">
                  <h4 class="card-header">CONSULTA DE NUTRICIÓN</h4>
                </div>
                <div class="section double-padded">
                  <div class="flex flex-column">
                    <div class="bottom-double-padded">
                      <div class="flex align-center">
                        <input
                          onClick={() =>
                            setNutricion(radioUrls.nutricion.online.url)
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
                            setNutricion(radioUrls.nutricion.presencial.url)
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
                            setNutricion(radioUrls.nutricion.domicilio.url)
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
                          Domicilio {radioUrls.nutricion["domicilio"].sesiones}{" "}
                          disponibles
                        </label>
                      </div>
                    </div>
                    <button
                      style={styles.button}
                      onClick={() => {
                        nutricion
                          ? calendlyClick(nutricion)
                          : tabOpen("https://greenbeet.mx/collections");
                      }}
                      class="rounded align-self-start"
                    >
                      {nutricion ? (
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
