import * as React from "react";
import Axios from "axios";
import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import { openPopupWidget } from "react-calendly";
import { AlertDialog, AlertDialogLabel } from "@reach/alert-dialog";
import "@reach/dialog/styles.css";

type UrlType = {
  url: string;
  usuario: number;
  sesiones_restantes_nutricion: number;
  sesiones_restantes_entrenamiento: number;
  nombre_evento: string;
  localizacion: string;
};

const getUserData = async ({ id }: { id: number }) => {
  console.log({ id });
  const url = `https://greenbeet.vercel.app/api/user/${id}`;
  const userdata = await Axios.get<{
    urls: UrlType[];
  }>(url);
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

const styles: {
  [key: string]: React.CSSProperties;
} = {
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

declare global {
  interface Window {
    ShopifyAnalytics: {
      meta: {
        page: {
          customerId: string;
        };
      };
    } | null;
    collection_title: string;
  }
}

type AvailabilityProps = {
  openDialog: () => void;
  closeDialog: () => void;
  isOpen: boolean;
};
const AvailabilityButton: React.FunctionComponent<AvailabilityProps> = ({
  openDialog,
  closeDialog,
  isOpen,
}) => {
  const ref = React.useRef();
  return (
    <>
      {isOpen && (
        <AlertDialog onDismiss={closeDialog} leastDestructiveRef={ref}>
          <AlertDialogLabel>content</AlertDialogLabel>
        </AlertDialog>
      )}
      <button className="" onClick={openDialog} style={{ color: "white" }}>
        Ver Disponibilidad
      </button>
    </>
  );
};

const App: React.FunctionComponent<{ userId?: string }> = ({ userId = "" }) => {
  const calendlyClick = (url) => openPopupWidget({ url });
  const tabOpen = (url) => window.open(url, "_blank");
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedOption, setSelectedOption] = React.useState("");
  let id =
    userId ||
    (window.ShopifyAnalytics && window.ShopifyAnalytics.meta.page.customerId);
  console.log({ w: window.ShopifyAnalytics, id });
  let collection_title = window.collection_title || "entrenamiento";

  let build_mode = "entrenamiento";

  const openDialog = () => setIsOpen(true);
  const closeDialog = () => setIsOpen(false);

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

  const {
    data = {
      urls: [],
    },
    refetch,
    isLoading,
    isFetching,
  } = useQuery(
    [
      "user.data",
      {
        id,
      },
    ],
    // @ts-ignore
    async (p) => await getUserData(p.queryKey[1]),
    {
      refetchOnWindowFocus: false,
    }
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
    if (!urlObject.localizacion) return;

    if (urlObject.sesiones_restantes_entrenamiento > 0) {
      const links = urlObject.url.split(", ");
      radioUrls.entrenamiento[urlObject.localizacion].url = links[0];
      radioUrls.entrenamiento[urlObject.localizacion].sesiones +=
        urlObject.sesiones_restantes_entrenamiento;
    }

    if (urlObject.sesiones_restantes_nutricion > 0) {
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
    } else if (selectedOption === appointmentsEnums.entrenamiento.domicilio) {
      url = radioUrls.entrenamiento.domicilio.url;
    }
  }

  let hasSelectedUrl = !!url;

  // Actualizar los datos si se hace la compra de un producto.
  React.useEffect(() => {
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
  React.useEffect(() => {
    console.log("execute");
    const copiedUrl = `${url}`;
    async function handleCalendlyMessage(e) {
      const url = `${copiedUrl}`;
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
  });

  return (
    <div>
      <div>
        <div>
          <div className="row justify-center">
            <div
              style={styles.greenBackground}
              className="card col-sm-12 col-md-3 shadowed"
            >
              <div className="section double-padded">
                <h4 className="card-header">
                  {build_mode === "entrenamiento"
                    ? "ENTRENAMIENTO PERSONAL"
                    : "CONSULTA DE NUTRICIÓN"}
                </h4>
              </div>
              <div
                style={{
                  padding: "calc(1.5 * var(--universal-padding))",
                  paddingTop: 0,
                }}
              >
                {/* 
                <AvailabilityButton
                  closeDialog={closeDialog}
                  openDialog={openDialog}
                  isOpen={isOpen}
                />
                */}
              </div>
              {isLoading || isFetching ? (
                <Loader />
              ) : (
                <>
                  {build_mode === "entrenamiento" ? (
                    <>
                      <div className="section double-padded">
                        <div className="flex flex-column">
                          <div className="bottom-double-padded">
                            <div className="flex align-center">
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
                                autoComplete="off"
                              />
                              <label
                                className="card-label"
                                style={styles.label}
                                htmlFor="online-entrenamiento"
                              >
                                Online{" "}
                                {radioUrls.entrenamiento["online"].sesiones}{" "}
                                disponibles
                              </label>
                            </div>
                            <div className="flex align-center">
                              <input
                                name="tipo"
                                type="radio"
                                id="domicilio-entrenamiento"
                                autoComplete="off"
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
                                className="card-label"
                                style={styles.label}
                                htmlFor="domicilio-entrenamiento"
                              >
                                Domicilio{" "}
                                {radioUrls.entrenamiento["domicilio"].sesiones}{" "}
                                disponibles
                              </label>
                            </div>
                          </div>
                          <button
                            className="rounded align-self-start"
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
                      <div className="section double-padded">
                        <div className="flex flex-column">
                          <div className="bottom-double-padded">
                            <div className="flex align-center">
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
                                autoComplete="off"
                              />
                              <label
                                className="card-label"
                                style={styles.label}
                                htmlFor="online-nutricion"
                              >
                                Online {radioUrls.nutricion["online"].sesiones}{" "}
                                disponibles
                              </label>
                            </div>
                            <div className="flex align-center">
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
                                autoComplete="off"
                              />
                              <label
                                className="card-label"
                                style={styles.label}
                                htmlFor="presencial-nutricion"
                              >
                                Presencial{" "}
                                {radioUrls.nutricion["presencial"].sesiones}{" "}
                                disponibles
                              </label>
                            </div>
                            <div className="flex align-center">
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
                                autoComplete="off"
                              />
                              <label
                                className="card-label"
                                style={styles.label}
                                htmlFor="domicilio-nutricion"
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
                            className="rounded align-self-start"
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
  <div className="lds-ring">
    <div></div>
    <div></div>
    <div></div>
    <div></div>
  </div>
);

const queryClient = new QueryClient();
const Wrapper: typeof App = (props) => (
  <QueryClientProvider client={queryClient}>
    <App {...props} />
  </QueryClientProvider>
);
export default Wrapper;
