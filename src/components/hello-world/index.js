import { h, Component } from 'preact';
import { useState } from 'preact/hooks';
import Axios from 'axios';
import { useQuery } from 'react-query';
import './style.scss';

export default class App extends Component {
	render(props) {
		return <Header {...props} />;
	}
}

const getUserData = async (key, { id }) => {
	const userdata = await Axios.post(`http://localhost:8000/api/user/${id}`);

	return userdata.data;
};

const Header = (props) => {
	const [ count, setCount ] = useState(0);
	useQuery;

	const { data } = useQuery(
		[
			'user.data',
			{
				id: 123
			}
		],
		getUserData
	);

	return (
		<div>
			<h1 style={{ color: props.color, alignContent: 'center' }}> World!</h1>
			<button onClick={() => setCount((c) => c + 1)}>{count}</button>
			<div>{JSON.stringify(data, null, 2)}</div>
		</div>
	);
};
