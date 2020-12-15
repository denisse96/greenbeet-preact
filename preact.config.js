const tailwind = require('tailwindcss');

export default (config, env, helpers) => {
	const results = helpers.getLoadersByName(config, 'postcss-loader');
	for (const result of results) {
		if (result.loader.options.postcssOptions) {
			result.loader.options.postcssOptions.plugins = [
				tailwind('./tailwind.config.js')
				// other postcss plugins can be added here
				//...result.loader.options.plugins
			];
		}
	}
	delete config.entry.polyfills;
	//config = tailwind(config, env, helpers);
	config.output.filename = '[name].js';

	//let { plugin } = helpers.getPluginsByName(config, 'ExtractTextPlugin')[0];
	//plugin.options.disable = true;

	if (env.production) {
		config.output.libraryTarget = 'umd';
	}
	//return config;
};
