var cc = DataStudioApp.createCommunityConnector();


function getData(request) {
  if (!request || !request.configParams || !request.fields) {
    throw new Error('Invalid request from Looker Studio');
  }


  var c = request.configParams;
  var appId = (c.app_id || '').trim();

  if (!/^\d+$/.test(appId)) {
    throw new Error('Invalid App ID. Must be numeric.');
  }

  var MAX_ROWS = Number(c.row_limit) || 100;
  var token = generateJwtFromConfig_(c);

  var url =
    'https://api.appstoreconnect.apple.com/v1/apps/' +
    appId +
    '/customerReviews?sort=-createdDate&limit=200';

  // Build schema ONLY for requested fields, in requested order
  var requestedIds = [];
  for (var i = 0; i < request.fields.length; i++) {
    var f = request.fields[i];
    requestedIds.push(f.name || f.fieldId || f.id);
  }

  if (!requestedIds.length) {
    throw new Error('No fields requested by Looker Studio.');
  }



  var requestedFields = getFields_().forIds(requestedIds);
  var schema = requestedFields.build();

  if (!schema || !schema.length) {
    throw new Error('Unable to build schema from requested fields: ' + JSON.stringify(requestedIds));
  }

  console.log('Schema length: ' + schema.length);

  var rows = [];

  while (url && rows.length < MAX_ROWS) {
    console.log('Fetching URL: ' + url);

    var obj = fetchJson_(url, token);
    var data = obj.data || [];

    console.log('Fetched reviews count: ' + data.length);

    for (var j = 0; j < data.length && rows.length < MAX_ROWS; j++) {
      var r = data[j];
      var a = r.attributes || {};
      var values = [];

      for (var k = 0; k < schema.length; k++) {
        var fieldName = schema[k].name;

        switch (fieldName) {
          case 'review_id':
            values.push(r.id || '');
            break;

          case 'rating':
            values.push(a.rating != null ? Number(a.rating) : null);
            break;

          case 'title':
            values.push(a.title || '');
            break;

          case 'body':
            values.push(a.body || '');
            break;

          case 'nickname':
            values.push(a.reviewerNickname || '');
            break;

          case 'territory':
            values.push(a.territory || '');
            break;

          case 'created_date':
            values.push(
              a.createdDate
                ? a.createdDate.substring(0, 10).replace(/-/g, '')
                : null
            );
            break;

          default:
            values.push(null);
        }
      }

      if (values.length !== schema.length) {
        throw new Error(
          'Column mismatch while building row: expected ' +
            schema.length +
            ', got ' +
            values.length
        );
      }

      rows.push({ values: values });
    }

    url = (obj.links && obj.links.next) ? obj.links.next : null;
  }


  return {
    schema: schema,
    rows: rows
  };
}


function fetchJson_(url, token) {
  var lastText = '';
  var lastCode = 0;
  // retry 3 times for transient errors
  for (var attempt = 1; attempt <= 3; attempt++) {
    var resp = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: { Authorization: 'Bearer ' + token },
      muteHttpExceptions: true
    });

    var code = resp.getResponseCode();
    var text = resp.getContentText();

    lastCode = code;
    lastText = text;

    // Success
    if (code >= 200 && code < 300) {
      return JSON.parse(text);
    }


    console.error('ASC HTTP ' + code + ' attempt ' + attempt + ' url=' + url);
    console.error('ASC body: ' + text);

    if (code === 429 || (code >= 500 && code <= 599)) {
      Utilities.sleep(attempt * 1000); 
      continue;
    }

    throw new Error('ASC HTTP ' + code + ': ' + text);
  }

  throw new Error('ASC HTTP ' + lastCode + ' after retries: ' + lastText);
}




function getAuthType() {
  var AuthTypes = cc.AuthType;
  return cc
    .newAuthTypeResponse()
    .setAuthType(AuthTypes.NONE)
    .build();
}

function isAdminUser() {
  return false;
}

function getConfig(request) {
  var cc = DataStudioApp.createCommunityConnector();
  var config = cc.getConfig();

  config.newTextInput()
    .setId('app_id')
    .setName('App ID (numeric)')
    .setHelpText('Example: 1234567890')
    .setPlaceholder('APP ID');

  config.newTextInput()
    .setId('key_id')
    .setName('Key ID')
    .setHelpText('From App Store Connect API Key')
    .setPlaceholder('key_id');

  config.newTextInput()
    .setId('issuer_id')
    .setName('Issuer ID')
    .setHelpText('From App Store Connect')
    .setPlaceholder('issuer_id');

  config.newTextArea()
    .setId('private_key')
    .setName('Private Key (.p8 content)')
    .setHelpText('Paste the full .p8 key. BEGIN/END lines optional.')
    .setPlaceholder('private_key');

  config.newSelectSingle()
    .setId('row_limit')
    .setName('Max rows to return')
    .setHelpText('Please select Max number of rows')
    .addOption(config.newOptionBuilder().setLabel('100').setValue('100'))
    .addOption(config.newOptionBuilder().setLabel('200').setValue('200'))
    .addOption(config.newOptionBuilder().setLabel('500').setValue('500'))
    .addOption(config.newOptionBuilder().setLabel('1000').setValue('1000'));

  return config.build();
}







function getFields_() {
  var cc = DataStudioApp.createCommunityConnector();
  var fields = cc.getFields();
  var types = cc.FieldType;

  fields.newDimension().setId('review_id').setName('Review ID').setType(types.TEXT);
  fields.newMetric().setId('rating').setName('Rating').setType(types.NUMBER);
  fields.newDimension().setId('title').setName('Title').setType(types.TEXT);
  fields.newDimension().setId('body').setName('Body').setType(types.TEXT);
  fields.newDimension().setId('nickname').setName('Nickname').setType(types.TEXT);
  fields.newDimension().setId('territory').setName('Territory').setType(types.TEXT);
  fields.newDimension()
  .setId('created_date')
  .setName('Created Date')
  .setType(types.YEAR_MONTH_DAY);


  return fields;
}


function getSchema(request) {
  var fields = getFields_();

  if (request && request.fields && request.fields.length) {
    var requestedIds = [];
    for (var i = 0; i < request.fields.length; i++) {
      var f = request.fields[i];
      requestedIds.push(f.name || f.fieldId || f.id);
    }
    return { schema: fields.forIds(requestedIds).build() };
  }

  return { schema: fields.build() };
}





function normalizePrivateKey_(input) {

  if (!input) return '';

  var k = String(input);


  k = k.replace(/\r/g, '\n').replace(/\\n/g, '\n').trim();

  if (k.indexOf('-----BEGIN') !== -1) {
    k = k.replace(/\n{3,}/g, '\n\n').trim();
    return k;
  }

  k = k.replace(/\s+/g, '').trim();

  var lines = [];
  for (var i = 0; i < k.length; i += 64) {
    lines.push(k.substring(i, i + 64));
  }

  return '-----BEGIN PRIVATE KEY-----\n' + lines.join('\n') + '\n-----END PRIVATE KEY-----';
}




function generateJwtFromConfig_(c) {
  var now = Math.floor(Date.now() / 1000);

  var issuerId = (c.issuer_id || '').trim();
  var keyId = (c.key_id || '').trim();
  var privKey = normalizePrivateKey_(c.private_key);

  if (!issuerId) throw new Error('issuer_id is required.');
  if (!keyId) throw new Error('key_id is required.');
  if (!privKey) throw new Error('private_key is required.');

  try {
    return KJUR.jws.JWS.sign(
      'ES256',
      JSON.stringify({ alg: 'ES256', kid: keyId, typ: 'JWT' }),
      JSON.stringify({
        iss: issuerId,
        iat: now,
        exp: now + 1200,
        aud: 'appstoreconnect-v1'
      }),
      privKey
    );
  } catch (e) {

    throw new Error(
      'JWT signing failed. Make sure you pasted the App Store Connect API key (.p8) for ES256.\n' +
      'Tip: Paste either the full PEM with BEGIN/END lines or the base64 body only.\n' +
      'Original: ' + (e && e.message ? e.message : e)
    );
  }
}


