// API anahtarı ve URL'yi çevre değişkenlerinden içe aktar
import { OPENAI_API_KEY, OPENAI_API_URL } from '@env';

/**
 * OpenAI API ile tarif oluşturma
 * @param {string} ingredients - Kullanılacak malzemeler
 * @param {string} query - Kullanıcının ek talepleri
 * @param {Array} allergies - Kullanıcının alerjileri
 * @param {Array} dietPreferences - Kullanıcının diyet tercihleri
 * @returns {Promise} - API yanıtı
 */
export const generateRecipe = async (ingredients, query = '', allergies = [], dietPreferences = []) => {
  try {
    // İstek metni oluştur
    let promptText = `Buzdolabımda şu malzemeler var: ${ingredients}. `;
    
    if (query) {
      promptText += `${query}. `;
    }
    
    if (allergies.length > 0) {
      promptText += `Alerjilerim: ${allergies.join(', ')}. `;
    }
    
    if (dietPreferences.length > 0) {
      promptText += `Diyet tercihlerim: ${dietPreferences.join(', ')}. `;
    }
    
    promptText += 'Elimdeki malzemeleri, alerjilerimi ve diyet tercihlerimi veriyorum. Bu bilgilere göre bana uygun, lezzetli ve pratik bir yemek tarifi öner. Tüm malzemeleri kullanmak zorunda değilsin, ama elimdeki malzemelerden olabildiğince faydalanmaya çalış. Diyet tercihlerime ve alerjilerime kesinlikle uymalısın. Tarif başlığı kısa ve öz olmalı, maksimum 20 karakter uzunluğunda olsun. Tarifin adım adım yapılışını ve varsa ekstra ipuçlarını da yaz. Yanıtı şu formatta ver: \"Başlık: [Tarif Adı], Malzemeler: [malzeme listesi], Tarif: [tarif adımları]\"';

    // OpenAI API'ye fetch ile istek gönder
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Sen bir profesyonel şefsin ve kullanıcıya verilen malzemelerle lezzetli tarifler sunuyorsun.' },
          { role: 'user', content: promptText }
        ],
        temperature: 0.7,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI Hata Yanıtı:', errorData);
      throw new Error(`OpenAI yanıtı başarısız: ${response.status}`);
    }

    const data = await response.json();
    const recipeText = data.choices[0].message.content.trim();

    // Yanıtı düzenle ve geri döndür
    return parseRecipeFromResponse(recipeText);

  } catch (error) {
    console.error('OpenAI API fetch hatası:', error);
    throw new Error(`Tarif oluşturulurken hata: ${error.message}`);
  }
};

/**
 * API yanıtını tarif formatına dönüştür
 * @param {string} responseText - API yanıtı
 * @returns {Object} - Düzenlenmiş tarif 
 */
const parseRecipeFromResponse = (responseText) => {
  let title = 'Önerilen Tarif';
  let ingredients = [];
  let instructions = '';

  try {
    const titleMatch = responseText.match(/Başlık: (.+)(?=,|$|\n)/i);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
    }

    const ingredientsMatch = responseText.match(/Malzemeler: (.+?)(?=Tarif:|$)/is);
    if (ingredientsMatch && ingredientsMatch[1]) {
      const ingredientsText = ingredientsMatch[1].trim();
      ingredients = ingredientsText
        .split(/[\n,]+/)
        .map(item => item.trim())
        .filter(item => item.length > 0);
    }

    const instructionsMatch = responseText.match(/Tarif: (.+)$/is);
    if (instructionsMatch && instructionsMatch[1]) {
      instructions = instructionsMatch[1].trim();
    } else {
      const restOfText = responseText.replace(/Başlık: .+\nMalzemeler: .+\n/is, '');
      instructions = restOfText.trim();
    }
  } catch (error) {
    console.error('Tarif ayrıştırma hatası:', error);
    instructions = responseText;
  }

  return {
    title,
    ingredients,
    instructions
  };
};
