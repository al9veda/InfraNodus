{
	'targets': [
		{
			'target_name': 'node_lemmer',
			'include_dirs': [ 'include' ],
			'cflags!': [ '-fno-exceptions' ],
			'cflags_cc!': [ '-fno-exceptions' ],
			'sources': [
				'src/automaton_basic.c',
				'src/lemmatizer.c',
				'src/paradigms.c',
				'src/prediction.c',
				'src/russian/charset_adapters.c',
				'src/english/charset_adapters.c',
				'src/node-lemmer.cc'
			],
			'conditions': [
				['OS=="mac"', {
					'xcode_settings': {
						'GCC_ENABLE_CPP_EXCEPTIONS': 'YES'
					}
				}]
			]
		}
	]
}

